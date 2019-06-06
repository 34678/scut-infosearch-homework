let http = require('http');
let fs = require('fs');
let text = '';
let obj = {
    'TD01' : '国际合作',
    'TD02': '学院',
    'TD03' : '粤港澳',
    'TD04' : '创新',
    'TD05' : '思政',
    'TD06' : '招聘',
    'TD07' : '研究',
    'TD08' :'招生'
};
// 之前爬取的文章总数
const TOTAL_DOC = 121;
function getsimilarity(docnum,tf,totalword){
    return Number((TOTAL_DOC/docnum)*(tf/totalword).toFixed(10));
}
let data = fs.readFileSync("./db.txt").toString();
var obj2 = JSON.parse(data);
for(x in obj){
    let keyArr = obj2[obj[x]];
    if(keyArr){
        // 存放url和相似度对象的值
        let similarity = [];
        let docnum = keyArr.length;
        keyArr.forEach(x => {
            let tmp = {};
            tmp.url = x.url;
       
            tmp.similarityval = getsimilarity(docnum,x.tf,x.totalWord);
            similarity.push(tmp);
        });
        similarity.sort((a,b)=>{
            return a.similarityval<b.similarityval;
        })
        similarity = similarity.slice(0,11);
        text += `${x}\n`;
        // TODO 在这里加上10个的限制
        similarity.forEach(x => {
            text += `url:${x.url}  相似度:${x.similarityval}\n`;
        });
    }
}

fs.writeFileSync("./result.txt",text, (err) => {
    if (err) throw err;
    console.log('It\'s saved!');
  });
