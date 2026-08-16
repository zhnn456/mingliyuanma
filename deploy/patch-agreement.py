# -*- coding: utf-8 -*-
"""协议 HTML 增强：签署人信息表单 + 手写签名板"""
p = r'public\source-deploy-agreement.html'
s = open(p, encoding='utf-8').read()

# 1. 插入签署人表单（checkbox 前）
old = '''    <div class="confirm-desc">请仔细阅读以上全部条款，勾选确认后点击签署按钮完成电子签字</div>
    <div class="checkbox-row">'''
new = '''    <div class="confirm-desc">请仔细阅读以上全部条款，填写签署人信息并手写签名后完成电子签字</div>

    <!-- 签署人信息 -->
    <div class="signer-form" style="margin:18px auto 4px;max-width:520px;text-align:left;">
      <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:12px;">签署人信息（用于协议存证，仅甲方留存）</div>
      <div style="display:grid;grid-template-columns:110px 1fr;gap:10px 0;align-items:center;font-size:13px;color:#555;">
        <label for="signerName">真实姓名：</label>
        <input type="text" id="signerName" placeholder="请输入真实姓名" style="padding:8px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;" />
        <label for="signerIdCard">身份证号：</label>
        <input type="text" id="signerIdCard" placeholder="18 位身份证号" maxlength="18" style="padding:8px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;" />
        <label for="signerPhone">手机号码：</label>
        <input type="text" id="signerPhone" placeholder="11 位手机号" maxlength="11" style="padding:8px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;" />
      </div>
    </div>

    <!-- 手写签名板 -->
    <div class="signer-form" style="margin:14px auto;max-width:520px;text-align:left;">
      <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px;">手写签名 <span style="font-weight:400;font-size:12px;color:#86909c;">（请使用鼠标或手指在框内书写您的姓名）</span></div>
      <div style="position:relative;border:1.5px dashed #c9c9c9;border-radius:8px;overflow:hidden;background:#fafafa;">
        <canvas id="signCanvas" width="520" height="140" style="display:block;width:100%;height:140px;touch-action:none;cursor:crosshair;"></canvas>
      </div>
      <div style="margin-top:6px;display:flex;justify-content:flex-end;">
        <button type="button" onclick="clearSignature()" style="padding:5px 14px;border:1px solid #d9d9d9;background:#fff;border-radius:6px;font-size:12px;color:#666;cursor:pointer;">清除重写</button>
      </div>
    </div>

    <div id="signerError" style="display:none;color:#e5484d;font-size:13px;margin:8px auto;max-width:520px;text-align:left;"></div>
    <div class="checkbox-row">'''
assert old in s, 'confirm-desc block not found'
s = s.replace(old, new)

# 2. 替换脚本
old_script = '''function toggleSignBtn() {
  var cb = document.getElementById('agreeCheckbox');
  var btn = document.getElementById('signBtn');
  btn.disabled = !cb.checked;
}

function doSign() {
  var now = new Date();
  var dateStr = now.getFullYear() + ' 年 ' +
    String(now.getMonth() + 1).padStart(2, '0') + ' 月 ' +
    String(now.getDate()).padStart(2, '0') + ' 日 ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  document.getElementById('signBtn').style.display = 'none';
  document.querySelector('.checkbox-row').style.display = 'none';
  document.getElementById('signedInfo').style.display = 'block';
  document.getElementById('signedDetail').innerText =
    '签署时间：' + dateStr + ' · IP：' + (window.clientIP || '已记录') + ' · 协议编号：' + (window.contractNo || 'LIC-DEPLOY-' + Date.now());
  document.getElementById('partySigPlaceholder').innerText = '✓ 已签署';
  document.getElementById('partySignDate').innerText = '签署日期：' + dateStr;

  // 签署信息回传主站保存
  var contract = window.__contract || {};
  var clientIP = window.clientIP || '';
  try {
    fetch('/api/agreement/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no: contract.no || window.contractNo || '',
        name: contract.name || '',
        domain: contract.domain || '',
        contact: contract.contact || '',
        email: contract.email || '',
        signTime: dateStr,
        ip: clientIP,
      }),
    }).catch(function () {});
  } catch (e) {}
}'''

new_script = '''// ===== 手写签名板 =====
var sigCanvas = document.getElementById('signCanvas');
var sigCtx = sigCanvas ? sigCanvas.getContext('2d') : null;
var sigDrawing = false;
var sigSigned = false;

if (sigCanvas) {
  var dpr = window.devicePixelRatio || 1;
  var rect = sigCanvas.getBoundingClientRect();
  sigCanvas.width = rect.width * dpr;
  sigCanvas.height = 140 * dpr;
  sigCtx.scale(dpr, dpr);
  sigCtx.strokeStyle = '#1a1a1a';
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';

  sigCanvas.addEventListener('mousedown', sigStart);
  sigCanvas.addEventListener('mousemove', sigMove);
  sigCanvas.addEventListener('mouseup', sigEnd);
  sigCanvas.addEventListener('mouseleave', sigEnd);
  sigCanvas.addEventListener('touchstart', function (e) { e.preventDefault(); sigStart(e.touches[0]); }, { passive: false });
  sigCanvas.addEventListener('touchmove', function (e) { e.preventDefault(); sigMove(e.touches[0]); }, { passive: false });
  sigCanvas.addEventListener('touchend', sigEnd);
}

function sigPos(e) {
  var r = sigCanvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function sigStart(e) { sigDrawing = true; sigCtx.beginPath(); var p = sigPos(e); sigCtx.moveTo(p.x, p.y); }
function sigMove(e) {
  if (!sigDrawing) return;
  var p = sigPos(e);
  sigCtx.lineTo(p.x, p.y);
  sigCtx.stroke();
}
function sigEnd() {
  sigDrawing = false;
  if (sigCtx) {
    var d = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data;
    for (var i = 3; i < d.length; i += 4) {
      if (d[i] > 0) { sigSigned = true; break; }
    }
  }
  toggleSignBtn();
}
function clearSignature() {
  if (!sigCanvas) return;
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  sigSigned = false;
  toggleSignBtn();
}

// ===== 身份证号校验（18 位，含校验位算法） =====
function isValidIdCard(id) {
  if (!/^\\d{17}[\\dXx]$/.test(id)) return false;
  var weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  var codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  var sum = 0;
  for (var i = 0; i < 17; i++) sum += parseInt(id[i], 10) * weights[i];
  return codes[sum % 11] === id[17].toUpperCase();
}

function toggleSignBtn() {
  var cb = document.getElementById('agreeCheckbox');
  var btn = document.getElementById('signBtn');
  var name = document.getElementById('signerName');
  var ok = cb && cb.checked && name && name.value.trim().length >= 2 && sigSigned;
  if (btn) btn.disabled = !ok;
}

function validateSigner() {
  var name = document.getElementById('signerName');
  var idCard = document.getElementById('signerIdCard');
  var phone = document.getElementById('signerPhone');
  var err = document.getElementById('signerError');
  if (!name || !idCard || !phone || !err) return false;
  if (name.value.trim().length < 2) { err.innerText = '请输入真实姓名（至少 2 个字）'; err.style.display = 'block'; return false; }
  if (!isValidIdCard(idCard.value.trim())) { err.innerText = '身份证号格式不正确，请核对后重试'; err.style.display = 'block'; return false; }
  if (!/^1\\d{10}$/.test(phone.value.trim())) { err.innerText = '手机号格式不正确'; err.style.display = 'block'; return false; }
  if (!sigSigned) { err.innerText = '请先手写签名'; err.style.display = 'block'; return false; }
  err.style.display = 'none';
  return true;
}

function doSign() {
  if (!validateSigner()) return;
  var now = new Date();
  var dateStr = now.getFullYear() + ' 年 ' +
    String(now.getMonth() + 1).padStart(2, '0') + ' 月 ' +
    String(now.getDate()).padStart(2, '0') + ' 日 ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  document.getElementById('signBtn').style.display = 'none';
  document.querySelector('.checkbox-row').style.display = 'none';
  var forms = document.querySelectorAll('.signer-form');
  for (var i = 0; i < forms.length; i++) forms[i].style.display = 'none';
  document.getElementById('signedInfo').style.display = 'block';
  document.getElementById('signedDetail').innerText =
    '签署人：' + document.getElementById('signerName').value.trim() +
    ' · 签署时间：' + dateStr +
    ' · IP：' + (window.clientIP || '已记录') +
    ' · 协议编号：' + (window.contractNo || 'LIC-DEPLOY-' + Date.now());
  document.getElementById('partySigPlaceholder').innerText = '✓ 已签署';
  document.getElementById('partySignDate').innerText = '签署日期：' + dateStr;

  // 签署信息回传主站保存（含身份信息与手写签名图）
  var contract = window.__contract || {};
  var clientIP = window.clientIP || '';
  var signature = '';
  try { signature = sigCanvas ? sigCanvas.toDataURL('image/png') : ''; } catch (e) {}
  try {
    fetch('/api/agreement/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no: contract.no || window.contractNo || '',
        name: contract.name || '',
        domain: contract.domain || '',
        contact: contract.contact || '',
        email: contract.email || '',
        signerName: document.getElementById('signerName').value.trim(),
        signerIdCard: document.getElementById('signerIdCard').value.trim(),
        signerPhone: document.getElementById('signerPhone').value.trim(),
        signature: signature,
        signTime: dateStr,
        ip: clientIP,
      }),
    }).catch(function () {});
  } catch (e) {}
}'''

assert old_script in s, 'old script not found'
s = s.replace(old_script, new_script)

open(p, 'w', encoding='utf-8', newline='').write(s)
print('agreement html updated OK')
