# -*- coding: utf-8 -*-
"""协议 HTML：甲方预盖章 + 重开显示签署状态"""
p = r'public\source-deploy-agreement.html'
s = open(p, encoding='utf-8').read()

# 1. 甲方签名区：加 canvas 放电子章
old_sig = '''      <div class="sig-box">
        <div class="role-label">甲方（授权方）：知微阁</div>
        <div class="sig-line">
          <span class="sig-placeholder">电子签章</span>
        </div>
        <div class="sig-label">签字/盖章</div>
        <div class="date-line">签署日期：______ 年 ___ 月 ___ 日</div>
      </div>'''
new_sig = '''      <div class="sig-box">
        <div class="role-label">甲方（授权方）：知微阁</div>
        <div class="sig-line" style="display:flex;justify-content:center;align-items:center;">
          <canvas id="sealCanvas" width="140" height="140" style="width:110px;height:110px;display:none;"></canvas>
          <span class="sig-placeholder" id="sealPlaceholder">电子签章</span>
        </div>
        <div class="sig-label">签字/盖章</div>
        <div class="date-line" id="partyASignDate">签署日期：______ 年 ___ 月 ___ 日</div>
      </div>'''
assert old_sig in s
s = s.replace(old_sig, new_sig)

# 2. 脚本：加公章绘制 + 状态查询，插入到现有 script 的签名板逻辑之前
anchor = "// ===== 手写签名板 ====="
seal_js = '''// ===== 甲方电子公章（动态绘制，含协议编号防伪） =====
function drawStar(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var r = i % 2 === 0 ? outerR : innerR;
    var angle = (i * Math.PI) / 5 - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSeal(no) {
  var canvas = document.getElementById('sealCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var cx = w / 2, cy = h / 2, R = w / 2 - 5;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#c41e2a';
  ctx.fillStyle = '#c41e2a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, R - 12, 0, Math.PI * 2); ctx.stroke();
  // 外圈弧形文字（顺时针从顶部开始）
  var text = '知微阁命理平台';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var i = 0; i < text.length; i++) {
    var angle = (i / text.length) * Math.PI * 2 - Math.PI / 2;
    var x = cx + (R - 7) * Math.cos(angle);
    var y = cy + (R - 7) * Math.sin(angle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(text.charAt(i), 0, 0);
    ctx.restore();
  }
  // 五角星
  drawStar(ctx, cx, cy - 7, 14, 6);
  // 合同专用章
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('合同专用章', cx, cy + 12);
  // 协议编号（防伪）
  ctx.font = '8px monospace';
  var noText = no || '';
  ctx.fillText(noText.length > 20 ? noText.slice(0, 19) + '…' : noText, cx, cy + 30);
  canvas.style.display = 'block';
  var ph = document.getElementById('sealPlaceholder');
  if (ph) ph.style.display = 'none';
  var dateEl = document.getElementById('partyASignDate');
  if (dateEl && window.__aSignDate) dateEl.innerText = '签署日期：' + window.__aSignDate;
}

// ===== 查询协议签署状态（重开链接时显示双方签署完成） =====
(function checkStatus() {
  var no = (window.__contract && window.__contract.no) || '';
  if (!no) return;
  fetch('/api/agreement/status?no=' + encodeURIComponent(no))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.signed) return;
      // 已签署：显示双方签署完成状态，隐藏签署表单
      var area = document.getElementById('confirmArea');
      if (area) area.style.display = 'none';
      var detail = document.getElementById('signedDetail');
      var info = document.getElementById('signedInfo');
      if (info) info.style.display = 'block';
      if (detail) {
        detail.innerText = '本协议已签署生效 · 签署人：' + (d.signerName || '') +
          ' · 签署时间：' + (d.signTime || '') +
          ' · IP：' + (d.ip || '已记录');
      }
      var ph = document.getElementById('partySigPlaceholder');
      if (ph) ph.innerText = '✓ 已签署';
      var sd = document.getElementById('partySignDate');
      if (sd) sd.innerText = '签署日期：' + (d.signTime || '');
      // 乙方签名图
      if (d.signature) {
        var sigBox = document.querySelector('.sig-box:nth-of-type(2) .sig-line');
        if (sigBox) {
          sigBox.innerHTML = '<img src="' + d.signature + '" alt="乙方手写签名" style="max-width:180px;max-height:70px;display:block;margin:0 auto;" />';
        }
      }
      // 甲方章
      drawSeal(no);
    })
    .catch(function () {});
})();

// ===== 手写签名板 ====='''
assert anchor in s
s = s.replace(anchor, seal_js)

# 3. doSign 后补甲方章与签署日期（在签名回传 fetch 之后追加甲方显示）
old_end = """  } catch (e) {}
}"""
new_end = """  } catch (e) {}

  // 甲方电子章 + 签署日期（甲方预盖章，乙方签署即双方生效）
  window.__aSignDate = dateStr;
  drawSeal(window.contractNo || '');
}"""
# 只替换最后一个（doSign 的结尾）
idx = s.rfind(old_end)
assert idx != -1
s = s[:idx] + new_end + s[idx + len(old_end):]

open(p, 'w', encoding='utf-8', newline='').write(s)
print('agreement html updated: seal + status check')
