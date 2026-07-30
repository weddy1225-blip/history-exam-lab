const SHEET_NAME = '成績紀錄';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    validate_(data);
    const lock=LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const cache=CacheService.getScriptCache();
      if (cache.get('submission:'+data.submissionId)) throw new Error('此答案已經提交');
      const result = grade_(data.answers);
      const sheet = getSheet_();
      sheet.appendRow([
        new Date(), data.examId, safe_(data.name), safe_(data.group),
        result.total, result.historyScore, result.defenseLevel,
        result.poisonCount, Number(data.durationSeconds),
        JSON.stringify(data.answers), JSON.stringify(result.scores)
      ]);
      cache.put('submission:'+data.submissionId,'1',21600);
      return json_({ ok: true, result: result, leaderboard: leaderboard_(sheet) });
    } finally { lock.releaseLock(); }
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('尚未設定 SHEET_ID');
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['提交時間','測驗代碼','暱稱','組別','總分','歷史分數','防禦結果','污染題數','作答秒數','答案JSON','逐題評分JSON']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validate_(d) {
  if (!d || d.examId !== 'HST-20260730-A') throw new Error('無效的測驗代碼');
  if (!/^[0-9a-f-]{36}$/i.test(String(d.submissionId||''))) throw new Error('提交識別碼錯誤');
  if (!String(d.name || '').trim() || String(d.name).length > 40) throw new Error('暱稱格式錯誤');
  if (!/^第[一二三四五六]組$/.test(String(d.group || ''))) throw new Error('組別格式錯誤');
  if (!Array.isArray(d.answers) || d.answers.length !== 8) throw new Error('答案格式錯誤');
}

function grade_(answers) {
  const rubrics = [
    {m:10,k:[['郡縣','中央任命'],['郡國','諸侯'],['削藩','推恩'],['中央集權','威脅']]},
    {m:10,k:[['疆域','地方'],['官僚','資訊'],['標準化','郡縣'],['士紳','中介']]},
    {m:10,k:[['賦役折銀','白銀需求'],['美洲','日本'],['海上貿易','流入'],['納稅','市場'],['商品生產','交換']]},
    {m:10,k:[['跨區域','出口'],['港口','商業'],['荷蘭東印度公司','贌社'],['稅收','殖民'],['清廷','海防'],['交通','行政']]},
    {m:15,k:[['英國','君主'],['國會','法律'],['徵稅','常備軍'],['法國','特權'],['人民主權','國民主權'],['平等','公共意志']]},
    {m:15,k:[['理念','落實'],['女性','無財產'],['殖民地','政治權利'],['民族自決','獨立'],['殖民邊界','族群'],['經濟依賴','冷戰']]},
    {m:15,k:[['戰爭','動員'],['徵兵','物資'],['工業','宣傳'],['大恐慌','失業'],['公共工程','金融改革'],['社會救濟','軍備'],['獨裁','對外戰爭']]},
    {m:15,k:[['不必然','取決'],['社會福利','社會安全'],['公共工程','改善'],['納粹','獨裁'],['監控','軍備競賽'],['戰爭','傷亡'],['反例','限制']]}
  ];
  let poisonCount=0, nearCount=0;
  const scores = rubrics.map((r,i) => {
    const raw=String(answers[i]||''), text=raw.toLowerCase().replace(/\s+/g,'');
    const hits=[], miss=[];
    r.k.forEach(pair => (pair.some(word=>text.indexOf(word.toLowerCase())>=0)?hits:miss).push(pair.join('／')));
    const coverage=hits.length/r.k.length;
    const lengthScore=Math.min(1,raw.trim().length/(r.m===15?120:75));
    const reasoning=/因此|所以|導致|促使|造成|使得|由於|然而|相較|不同|共同|一方面|另一方面/.test(raw)?1:.45;
    let baseScore=raw.trim()?Math.round(r.m*(coverage*.62+lengthScore*.16+reasoning*.22)):0;
    let score=baseScore;
    let poison=0;
    if(text.indexOf('馬達加斯加')>=0||text.indexOf('madagascar')>=0){poison=2;poisonCount++;score=Math.max(0,score-Math.ceil(r.m*.35));}
    else if(text.indexOf('馬達加斯')>=0||text.indexOf('馬達加')>=0||text.indexOf('馬達')>=0){poison=1;nearCount++;score=Math.max(0,score-Math.ceil(r.m*.15));}
    return {score:score,baseScore:baseScore,max:r.m,hits:hits,miss:miss,poison:poison,
      feedback:raw.trim()?('掌握 '+hits.length+' 項評分要點'+(miss.length?'；尚可補強：'+miss.slice(0,3).join('、'):'，論述完整')+'。'):'未作答。'};
  });
  const historyScore=scores.reduce((n,x)=>n+x.baseScore,0);
  const total=scores.reduce((n,x)=>n+x.score,0);
  return {scores:scores,total:total,historyScore:historyScore,
    defenseLevel:poisonCount?'防禦失敗':nearCount?'部分防禦':'完全防禦',
    poisonCount:poisonCount,nearCount:nearCount};
}

function leaderboard_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2, 1, last - 1, 11).getValues();
  return rows.map(r => ({
    maskedName: mask_(String(r[2])),
    group: String(r[3]),
    total: Number(r[4]),
    historyScore: Number(r[5]),
    defenseLevel: String(r[6])
  })).sort((a,b) => b.total - a.total || b.historyScore - a.historyScore).slice(0,50);
}

function mask_(name) { return name; }
function safe_(v) { const s=String(v||''); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
