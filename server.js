var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
    console.log('请指定端口号好不啦？')
    process.exit(1)
}

var server = http.createServer(function(request, response){
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** ************/

    console.log('含查询字符串的路径\n' + pathWithQuery)

    if(path === '/register' && method ==='GET'){
        let string = fs.readFileSync('./register.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    }
    else if(path === '/'){
        let string = fs.readFileSync('./index.html', 'utf8')
        let cookies = request.headers.cookie.split('; ');/*这里多出一个空格，要注意*/
        let hash = {};
        for(let i =0 ;i<cookies.length;i++){
            let parts = cookies[i].split('=');
            let key = parts[0];
            let value = parts[1];
            hash[key] = value;
        }

        let email = hash.email;

        let users = fs.readFileSync('./db/users', 'utf8');
        users= JSON.parse(users);
        var foundUser;
        for(let i = 0;i<users.length;i++){
            if(users[i].email = email){
               foundUser  = users[i];
               break;
            }
        }

        if(foundUser){string = string.replace('--email--',foundUser.email)}
        else{string = string.replace('--email--','未登录')}
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    }
    else if(path === '/register' && method ==='POST'){
        readBody(request).then((body) => {
            let strings = body.split('&');
            let hash = {};
            strings.forEach((string) => {
                let parts = string.split('=');
                let key = parts[0];
                let value = parts[1];
                hash[key] = decodeURIComponent(value) ;
               })
                let {email, password, password_confirm} = hash;

                if (email.indexOf('@') === -1) {
                    response.statusCode = 400;
                    response.setHeader('Content-Type', 'text/json;charset=utf-8')
                    response.write(`{"errors":
                    {"email":"invalid"}
                    }`);
                }
                else if (password !== password_confirm) {
                    response.statusCode = 400;
                    response.write('password not match');
                }
                else {
                    var users = fs.readFileSync('./db/users','utf8')
                    try{
                         users = JSON.parse(users)
                    }
                    catch(exception) {
                        users = [];
                    }
                    let inUse = false;
                    for(let i = 0;i<users.length;i++){
                        let user = users[i];
                        if(user.email = email)
                        {inUse = true}
                    }
                    if(inUse){
                        response.statusCode = 400
                        response.write('email inUse');
                    }else{
                        users.push({ email: email, password: password })
                        response.statusCode = 200
                        let usersString = JSON.stringify(users)
                        fs.writeFileSync('./db/users',usersString);

                    }


                }
                response.end()
        })
    }
    else if(path==='/login' && method ==="GET"){
        let string = fs.readFileSync('./login.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    }
    else if(path==='/login' && method ==="POST"){
        readBody(request).then((body) => {
            let strings = body.split('&');
            let hash = {};
            strings.forEach((string) => {
                let parts = string.split('=');
                let key = parts[0];
                let value = parts[1];
                hash[key] = decodeURIComponent(value);
            })
            let {email, password} = hash;
            var users = fs.readFileSync('./db/users','utf8')
            try{
                users = JSON.parse(users)
            }
            catch(exception) {
                users = [];
            }
            let found ;
            for(let i = 0;i<users.length;i++){
                let user = users[i];
                if(user.email === email && user.password === password)
                {found = true;
                break;}
            }
            if(found){
                response.setHeader('set-cookie',`email= ${email}`);
                response.statusCode = 200

            }else{
                response.statusCode = 401
            }
            response.end();
        })

    }
    else if(path==='/main.js'){
        let string = fs.readFileSync('./main.js', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
        response.write(string)
        response.end()
    }
    else if(path==='/xxx'){
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', 'http://localhost:8002')
        response.write(`
    {
      "note":{
        "to": "小谷",
        "from": "方方",
        "heading": "打招呼",
        "content": "hi"
      }
    }
    `)
        response.end()
    }
    else{
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(`
      {
        "error": "not found"
      }
    `)
        response.end()
    }


})
/********  ************/
function readBody(request){
    return new Promise((resolve,reject) => {
        let body = [];
        request.on('data',(chunk) => {
            body.push(chunk)
        }).on('end',() => {
            body = Buffer.concat(body).toString();
            resolve(body);
        })
    })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n http://localhost:' + port)
