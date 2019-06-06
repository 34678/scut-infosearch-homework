let http = require('http');
let fs = require('fs');
let url = require('url');
let queryString = require('querystring');

// 之前爬取的文章总数
const TOTAL_DOC = 121;
function getsimilarity(docnum,tf,totalword){
    return Number((TOTAL_DOC/docnum)*(tf/totalword).toFixed(10));
}
let server = http.createServer((req,res)=>{
    // 根据请求的路径和查询词 选择返回查询的厨师页面还是查询结果
    let {pathname,query} = url.parse(req.url,true);
    // console.log(query.val);
    let keyword = query.val;
    // let keyword = '招生';
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    // 把文件读出来 生成10个最前面的相似值
    let data = fs.readFileSync("./db.txt").toString();
    var obj = JSON.parse(data);
    let keyArr = obj[keyword];
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
        res.write(JSON.stringify(similarity));
    }else{
        res.write('此关键词没有搜索结果');
    }
    // console.log(obj['研究']);
    // debugger;
    // res.write('Hello, My Love')
    res.end()
    // return 1;
});
server.listen(1024);

