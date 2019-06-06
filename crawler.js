const puppeteer = require("puppeteer");
var moment = require("moment");
let fs = require("fs");
// 载入模块
var Segment = require('segment');
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();
segment.loadStopwordDict('./stopword.txt');

let waitForUrl = ["https://www.scut.edu.cn/new/"];
let waitForUrlChild = [];
let processedurl = [];
// 默认深度 -3层
let deep = Number.MAX_SAFE_INTEGER;
let refrence = {};
// 当前深度
let currdeep = 1;
(async () => {
  const browser = await puppeteer.launch({
    headless: true, //默认为true（无头），不显示浏览器界面
    slowMo: 200, //减速显示，有时会作为模拟人操作特意减速
    devtools: true //显示开发者工具。页面宽高默认800*600,把开发者工具显示再隐藏页面会占满屏幕，有没有大佬解释下？
  });
  //生成Page对象
  const page = await browser.newPage();
  // const page = (await browser.pages())[0]; //这是我的写法，只有一个tab
  let data = '词语 文章uri 词语频率 文章长度（词语数量）\n';
  let count = 0;
  // BFS爬取网页
  while (waitForUrl.length !== 0 || (waitForUrlChild.length !== 0)) {
    //   console.log(waitForUrl);
    // 把下面一层等待被爬取的url放进等待队列

    if (waitForUrl.length == 0) {
      currdeep++;
      waitForUrl = waitForUrlChild;
      waitForUrlChild = [];
    }
    count++;
    let url = waitForUrl.shift();
    processedurl.push(url);
    try {
      await page.goto(url,{timeout: 60000});
    } catch (err) {
      console.log(err);
    }
    // 拦截页面的资源请求
    // await page.setRequestInterception(true);
    let docContent = '';
    let jsHandle ;
    let myvar  = [];
    try {
      jsHandle = await page.evaluate(() => {
        // get content
        let content = document.body.innerText;
        // get href list
        let alist = document.getElementsByTagName("a");
        let res = [];
        alist = Array.from(alist);
        alist.forEach(e => {
          if (e.href) {
            res.push(e.href);
          }
        });
        // console.log(new Set(res));
        res = Array.from(new Set(res));
        const obj = {
          content:content,
          list:res
        }
        return Promise.resolve(obj);
      });
    } catch (err) {
      console.log(err);
    }

    // 更新待爬取数组
    if(jsHandle){
      myvar = jsHandle.list;
      myvar = myvar.filter(e => {
        return processedurl.indexOf(e) == -1 && waitForUrl.indexOf(e) == -1;
      });
      waitForUrlChild = waitForUrlChild.concat(myvar);
    }
    // 拿到文本的内容进行处理
    docContent = jsHandle?jsHandle.content:'';
    if(docContent){
      var result = segment.doSegment(docContent, {
        stripStopword: true,
        simple: true
      });
      result = Array.from(new Set(result));
      let wordtotalCount = 0;
      // 计算文章的词语总数
      result.forEach(x => {
        let num = getTF(docContent,x);
        wordtotalCount += num;
      });
      // 把新的记录加入索引
      result.forEach(x => {
        let num = getTF(docContent,x);
        updateRefrence(x,url,num,wordtotalCount);
        data += `${x} ${url} ${num} ${wordtotalCount}\n`;
      });
      fs.writeFileSync("./index.txt",data, (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
      });
      fs.writeFileSync("./db.txt",JSON.stringify(refrence), (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
      });
      fs.writeFileSync("./docnum.txt",count, (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
      });
      // console.log(count);
    }
  }
  await browser.close(); //关闭浏览器
})();
// 把新的记录加入索引
function updateRefrence(word,url,wordnum,totalWord){
  if(refrence[word]){
    let obj = {
      url:url,
      tf:wordnum,
      totalWord:totalWord
    };
    let indexInfo = refrence[word];
    indexInfo.push(obj);
    refrence[word] = indexInfo;
  }else{
    refrence[word] = [{
      url:url,
      tf:wordnum,
      totalWord:totalWord
    }]
  }
}
// 获取词语出现的频率
function getTF(context,word){  
  var count=context.split(word).length-1;
  return count;
}
