<#
.SYNOPSIS
    命理网 Cloudflare Pages 一键部署脚本
.DESCRIPTION
    自动完成：wrangler 安装/登录、D1/KV 创建、ID 回填、数据库迁移、密钥设置、构建、部署
    首次运行会创建所有 CF 资源；后续运行只做构建+部署
.PARAMETER SkipDeploy
    只做配置和构建，跳过最终部署（用于本地测试）
.PARAMETER SkipBuild
    跳过构建，直接部署已存在的 .vercel/output/static
.PARAMETER ProjectName
    Pages 项目名（默认 mingli-yuanma，只能小写字母/数字/短横线）
.EXAMPLE
    .\deploy-cf.ps1
    首次部署，全流程自动化
.EXAMPLE
    .\deploy-cf.ps1 -SkipDeploy
    只构建不部署，验证 CF 兼容性
.EXAMPLE
    .\deploy-cf.ps1 -SkipBuild
    代码已构建好，只推送到 CF
#>
[CmdletBinding()]
param(
    [switch]$SkipDeploy,
    [switch]$SkipBuild,
    [string]$ProjectName = "mingli-yuanma"
)

# 注意：用 Continue 而非 Stop。Stop 模式下 native command（npm/prisma/wrangler）
# 写 stderr（如 npm 的 deprecation 警告、prisma 的 Update available 提示）会
# 触发 NativeCommandError 立即中断脚本。所有错误判断改为依靠 $LASTEXITCODE。
$ErrorActionPreference = "Continue"

# 设置控制台为 UTF-8，避免中文乱码（PS 5.1 默认 GBK）
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
    chcp 65001 > $null
} catch {}

$root = $PSScriptRoot
Set-Location $root

function Write-Step($msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "    [X]  $msg" -ForegroundColor Red }
function Write-Info($msg){ Write-Host "    .   $msg" -ForegroundColor Gray }

# 写入 UTF-8 无 BOM 文件（PS 5.1 的 Set-Content -Encoding UTF8 会写 BOM，wrangler 解析 wrangler.toml 可能出问题）
$script:UTF8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, $script:UTF8NoBom)
}

# ============ 1. 环境检查 ============
Write-Step "步骤 1/5：环境检查"

# Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Err "未检测到 Node.js，请先安装 Node.js 18+：https://nodejs.org/"
    exit 1
}
$nodeVer = (node -v 2>$null)
Write-Ok "Node.js $nodeVer"

# npm
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Err "未检测到 npm"
    exit 1
}
Write-Ok "npm $(npm -v 2>$null)"

# wrangler
$wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
if (-not $wrangler) {
    Write-Warn2 "未检测到 wrangler，正在全局安装..."
    npm install -g wrangler 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Err "wrangler 安装失败"
        exit 1
    }
    Write-Ok "wrangler 已安装"
} else {
    Write-Ok "wrangler $(wrangler --version 2>$null)"
}

# 检查认证：优先环境变量 CLOUDFLARE_API_TOKEN，其次 wrangler login 状态
if ($env:CLOUDFLARE_API_TOKEN) {
    Write-Ok "已通过 CLOUDFLARE_API_TOKEN 环境变量认证"
    # 部分操作需要 account id，若同时设置了 CLOUDFLARE_ACCOUNT_ID 会自动使用
    if ($env:CLOUDFLARE_ACCOUNT_ID) {
        Write-Ok "CLOUDFLARE_ACCOUNT_ID 已设置"
    }
} else {
    $whoami = wrangler whoami 2>&1 | Out-String
    if ($whoami -match "not authenticated|not logged in|You must be logged in|Status: Error|You are not logged in") {
        Write-Warn2 "未登录 Cloudflare。请选择认证方式："
        Write-Host ""
        Write-Host "    [1] 浏览器登录（推荐，会弹浏览器授权）" -ForegroundColor White
        Write-Host "    [2] 使用 API Token（适合当前环境）" -ForegroundColor White
        Write-Host ""
        $authChoice = Read-Host "请选择 (1/2，默认 1)"
        if ([string]::IsNullOrWhiteSpace($authChoice) -or $authChoice -eq "1") {
            Write-Warn2 "正在打开浏览器授权，请在浏览器完成 Cloudflare 授权..."
            # 尝试在当前会话调用 wrangler login（部分非交互环境会失败）
            wrangler login 2>&1 | Out-Host
            if ($LASTEXITCODE -ne 0 -or ((wrangler whoami 2>&1 | Out-String) -match "not authenticated|not logged in")) {
                Write-Host ""
                Write-Err "wrangler login 在当前环境未能完成认证"
                Write-Host ""
                Write-Host "    请按以下任一方式处理后重新运行 .\deploy-cf.ps1：" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "    方式 A：打开新的 PowerShell 窗口执行 wrangler login" -ForegroundColor White
                Write-Host "           完成后回到当前窗口重新跑脚本" -ForegroundColor Gray
                Write-Host ""
                Write-Host "    方式 B：在当前窗口设置 API Token 环境变量后重跑" -ForegroundColor White
                Write-Host "           获取地址: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Gray
                Write-Host "           模板选 'Edit Cloudflare Workers'，加 Pages:Edit 权限" -ForegroundColor Gray
                Write-Host ""
                Write-Host '           $env:CLOUDFLARE_API_TOKEN = "<粘贴你的token>"' -ForegroundColor White
                Write-Host "           .\deploy-cf.ps1" -ForegroundColor White
                exit 1
            }
            Write-Ok "已通过浏览器登录 Cloudflare"
        } else {
            Write-Host ""
            Write-Host "    获取 API Token 步骤：" -ForegroundColor Yellow
            Write-Host "    1. 访问 https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor White
            Write-Host "    2. Create Token → 选 'Edit Cloudflare Workers' 模板" -ForegroundColor White
            Write-Host "    3. 添加 Cloudflare Pages:Edit 权限，Continue → 复制 Token" -ForegroundColor White
            Write-Host ""
            $tokenInput = Read-Host "粘贴 Token"
            if ([string]::IsNullOrWhiteSpace($tokenInput)) {
                Write-Err "Token 不能为空"
                exit 1
            }
            $env:CLOUDFLARE_API_TOKEN = $tokenInput.Trim()
            # 同时持久化到用户环境变量，避免下次新窗口要重设
            [Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", $env:CLOUDFLARE_API_TOKEN, "User")
            Write-Ok "CLOUDFLARE_API_TOKEN 已设置（并写入用户环境变量）"
            # 验证 token 有效
            $verifyWho = wrangler whoami 2>&1 | Out-String
            if ($verifyWho -match "not authenticated|invalid|forbidden|unauthorized") {
                Write-Err "Token 验证失败：$verifyWho"
                exit 1
            }
            Write-Ok "Token 验证通过"
        }
    } elseif ($whoami -match "Account ID|email|You are logged in|Assuming") {
        Write-Ok "已登录 Cloudflare"
    } else {
        Write-Warn2 "登录状态未知，尝试继续..."
        Write-Info $whoami
    }
}

# ============ 2. 资源创建与回填 ============
Write-Step "步骤 2/5：检查/创建 D1、KV 资源"

$wranglerToml = Join-Path $root "wrangler.toml"
if (-not (Test-Path $wranglerToml)) {
    Write-Err "未找到 wrangler.toml"
    exit 1
}
$content = Get-Content $wranglerToml -Raw -Encoding UTF8

# 从 wrangler.toml 读取 D1 数据库名（避免硬编码）
$dbName = "yuanmamingli"
if ($content -match 'database_name\s*=\s*"([^"]+)"') {
    $dbName = $Matches[1]
}

# --- D1 数据库 ---
$needD1 = $false
if ($content -match 'database_id\s*=\s*"(REPLACE_ME_D1_ID|YOUR_D1_ID|XXX|REPLACE_ME[^"]*)"') {
    $needD1 = $true
}
if ($needD1) {
    Write-Warn2 "wrangler.toml 中 database_id 是占位符，开始创建 D1 数据库 '$dbName'..."
    $d1Output = wrangler d1 create $dbName 2>&1 | Out-String
    Write-Info $d1Output
    if ($d1Output -match 'database_id\s*=\s*"([^"]+)"') {
        $newD1Id = $Matches[1]
        Write-Ok "D1 创建成功，ID: $newD1Id"
        # 回填到 wrangler.toml
        $content = [regex]::Replace($content, 'database_id\s*=\s*"[^"]*"', "database_id = `"$newD1Id`"")
        Write-FileUtf8NoBom -Path $wranglerToml -Content $content
        Write-Ok "已回填 database_id 到 wrangler.toml"
    } else {
        Write-Err "D1 创建失败或输出格式异常"
        Write-Err $d1Output
        exit 1
    }
} else {
    Write-Ok "D1 database_id 已配置，跳过创建（使用数据库: $dbName）"
}

# 重新读取以防 D1 回填后内容已变
$content = Get-Content $wranglerToml -Raw -Encoding UTF8

# --- KV 命名空间 ---
$needKV = $false
if ($content -match '^\s*id\s*=\s*"(REPLACE_ME_KV_ID|YOUR_KV_ID|XXX|REPLACE_ME[^"]*)"' -or
    $content -match '^\s*id\s*=\s*""\s*$') {
    $needKV = $true
}
if ($needKV) {
    Write-Warn2 "wrangler.toml 中 KV id 是占位符，开始创建 KV 命名空间 'SESSIONS'..."
    $kvOutput = wrangler kv namespace create SESSIONS 2>&1 | Out-String
    Write-Info $kvOutput
    # KV 输出 id = "xxxx"，但要避开 binding = "SESSIONS" 行
    $kvId = $null
    foreach ($line in ($kvOutput -split "`n")) {
        if ($line -match '^\s*id\s*=\s*"([^"]+)"') {
            $kvId = $Matches[1]
            break
        }
    }
    if ($kvId) {
        Write-Ok "KV 创建成功，ID: $kvId"
        # 替换 [[kv_namespaces]] 块下的 id 行
        $content = [regex]::Replace(
            $content,
            '(\[\[kv_namespaces\]\][^\[]*?id\s*=\s*)"[^"]*"',
            "`${1}`"$kvId`"",
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )
        Write-FileUtf8NoBom -Path $wranglerToml -Content $content
        Write-Ok "已回填 KV id 到 wrangler.toml"
    } else {
        Write-Err "KV 创建失败或输出格式异常"
        Write-Err $kvOutput
        exit 1
    }
} else {
    Write-Ok "KV id 已配置，跳过创建"
}

# ============ 3. NEXTAUTH_URL ============
Write-Step "步骤 3/5：检查 NEXTAUTH_URL"

$content = Get-Content $wranglerToml -Raw -Encoding UTF8
if ($content -match 'NEXTAUTH_URL\s*=\s*"https://REPLACE_ME\.example\.com"') {
    $defaultUrl = "https://$ProjectName.pages.dev"
    Write-Host ""
    Write-Host "    NEXTAUTH_URL 未设置。" -ForegroundColor Yellow
    Write-Host "    Pages 默认域名: $defaultUrl" -ForegroundColor Gray
    Write-Host "    若已绑定自定义域名，请输入你的域名（否则回车用默认）" -ForegroundColor Gray
    $custom = Read-Host "    输入完整 URL（如 https://mingli.example.com）"
    if ([string]::IsNullOrWhiteSpace($custom)) {
        $custom = $defaultUrl
    }
    $custom = $custom.TrimEnd('/')
    $content = [regex]::Replace(
        $content,
        'NEXTAUTH_URL\s*=\s*"[^"]*"',
        "NEXTAUTH_URL = `"$custom`""
    )
    Write-FileUtf8NoBom -Path $wranglerToml -Content $content
    Write-Ok "已设置 NEXTAUTH_URL = $custom"
} else {
    Write-Ok "NEXTAUTH_URL 已配置"
}

# ============ 4. 数据库迁移 ============
Write-Step "步骤 4/5：生成并应用 D1 迁移"

$migrationFile = Join-Path $root "prisma\migrations.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Warn2 "未找到 prisma/migrations.sql，正在生成..."
    # Prisma 把 "Update available" 等提示输出到 stderr，会触发 PowerShell Stop 模式的 NativeCommandError
    # 临时切换为 Continue 模式，并丢弃 stderr 输出
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --output prisma/migrations.sql --script 2>$null | Out-Null
    $migrateExit = $LASTEXITCODE
    $ErrorActionPreference = $prevEAP
    if ($migrateExit -ne 0 -or -not (Test-Path $migrationFile)) {
        Write-Err "迁移 SQL 生成失败（exit code: $migrateExit）"
        exit 1
    }
    Write-Ok "迁移 SQL 已生成"
} else {
    Write-Ok "migrations.sql 已存在"
}

# 询问是否推送到远程 D1
Write-Host ""
Write-Host "    是否将迁移推送到远程 D1？" -ForegroundColor Yellow
Write-Host "    首次部署必须选 Y；已部署过且 schema 未变可选 N" -ForegroundColor Gray
$pushMigration = Read-Host "    推送迁移？(Y/n)"
if ([string]::IsNullOrWhiteSpace($pushMigration) -or $pushMigration.ToLower() -eq "y") {
    Write-Warn2 "推送迁移到远程 D1..."
    wrangler d1 execute $dbName --remote --file=prisma/migrations.sql 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Err "D1 迁移失败"
        exit 1
    }
    Write-Ok "D1 迁移完成"
} else {
    Write-Ok "跳过 D1 迁移"
}

# ============ 5. 构建 + 部署 ============
Write-Step "步骤 5/5：构建并部署到 Cloudflare Pages"

# 安装依赖
if (-not (Test-Path (Join-Path $root "node_modules"))) {
    Write-Warn2 "未检测到 node_modules，运行 npm install..."
    npm install 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install 失败"
        exit 1
    }
}

	# 确保 @prisma/adapter-d1 已安装
	if (-not (Test-Path (Join-Path $root "node_modules\@prisma\adapter-d1\package.json"))) {
	    Write-Warn2 "安装 @prisma/adapter-d1（用 --legacy-peer-deps 解决版本冲突）..."
	    npm install --save-dev @prisma/adapter-d1 --legacy-peer-deps 2>&1 | Out-Host
	    if ($LASTEXITCODE -ne 0) {
	        Write-Err "依赖安装失败"
	        exit 1
	    }
	}

# 生成 Prisma Client
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Prisma Client 生成失败"
    exit 1
}
Write-Ok "Prisma Client 已生成"

	# 构建
	if (-not $SkipBuild) {
	    Write-Warn2 "构建 OpenNext Worker 版本（可能需要 2-3 分钟）..."
	    npm run build:worker 2>&1 | Out-Host
	    if ($LASTEXITCODE -ne 0) {
	        Write-Err "构建失败"
	        Write-Host ""
	        Write-Host "    常见原因：" -ForegroundColor Yellow
	        Write-Host "    1. 某些 Node.js 模块不兼容 Cloudflare Workers"
	        Write-Host "    2. 代码中用了 Node.js 专有 API（fs、crypto 等）"
	        Write-Host "    3. Prisma 适配器未正确配置 D1"
	        exit 1
	    }
	    Write-Ok "构建完成"
	} else {
	    Write-Ok "跳过构建（-SkipBuild）"
	    if (-not (Test-Path (Join-Path $root ".open-next\worker.js"))) {
	        Write-Err ".open-next/worker.js 不存在，无法跳过构建"
	        exit 1
	    }
	}

if ($SkipDeploy) {
    Write-Warn2 "已指定 -SkipDeploy，跳过部署"
    Write-Host ""
    Write-Host "    构建产物位置: .open-next/" -ForegroundColor Cyan
    Write-Host "    本地预览: npm run preview:worker" -ForegroundColor Cyan
    exit 0
}

# 设置 NEXTAUTH_SECRET（wrangler secret put 通过 stdin 读取纯 value）
Write-Warn2 "设置 NEXTAUTH_SECRET（如果已存在会覆盖）..."
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
$secretSet = $false
try {
    $cmdLine = "echo $secret | wrangler secret put NEXTAUTH_SECRET --name $ProjectName"
    cmd /c $cmdLine 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $secretSet = $true }
} catch {}
if (-not $secretSet) {
    try {
        "$secret`n" | wrangler secret put NEXTAUTH_SECRET --name $ProjectName 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $secretSet = $true }
    } catch {}
}
if (-not $secretSet) {
    Write-Warn2 "自动设置 NEXTAUTH_SECRET 失败，请手动设置："
    Write-Host "    已为你生成密钥: $secret" -ForegroundColor Gray
    Write-Host "    请在另一个 PowerShell 窗口执行：" -ForegroundColor Yellow
    Write-Host "        wrangler secret put NEXTAUTH_SECRET --name $ProjectName" -ForegroundColor White
    Write-Host "    然后粘贴上面的密钥并回车" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    设置完后回到此窗口继续（本次部署可继续，但运行时需要这个 secret）" -ForegroundColor Yellow
} else {
    Write-Ok "NEXTAUTH_SECRET 已设置"
}

# 部署（设置 OPEN_NEXT_DEPLOY=true 防止 wrangler 委托给 OpenNext 触发 Miniflare 崩溃）
Write-Warn2 "部署到 Cloudflare Workers..."
$env:OPEN_NEXT_DEPLOY = "true"
wrangler deploy 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Err "部署失败"
    exit 1
}
Write-Ok "部署完成"

# 输出结果
$content = Get-Content $wranglerToml -Raw -Encoding UTF8
$finalUrl = ""
if ($content -match 'NEXTAUTH_URL\s*=\s*"([^"]+)"') {
    $finalUrl = $Matches[1]
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  部署成功！" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Worker 域名:   https://$ProjectName.workers.dev" -ForegroundColor Cyan
if ($finalUrl -and $finalUrl -ne "https://$ProjectName.workers.dev") {
    Write-Host "  自定义域名:    $finalUrl" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  下次更新代码后，再次运行:" -ForegroundColor Gray
Write-Host "    .\deploy-cf.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  或者推送到 GitHub 让 Actions 自动部署" -ForegroundColor Gray
Write-Host ""
