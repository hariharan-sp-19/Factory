// basic variables
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname));
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var session = require('express-session');
var mongoose  = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');



http.listen(3000, function(){
  console.log('listening on *:3000');
});

mongoose.connect('localhost:27017/factory');
var Schema = mongoose.Schema;

var box = new Schema({
type:String,
item:[{_id:false,qty:Number,item:String}],
filled:[{_id:false,qty:Number,item:String}],
boxno:Number,
comment:String,
last:String
},{collection:'box-data'});

var boxmodel = mongoose.model('boxmodel',box);

var history = new Schema({
  from:String,
  to:String,
  item:String,
  qty:Number,
  date:Date
},{collection:'his-data'});

var hismodel = mongoose.model('hismodel',history);

var itemsch = new Schema({
name:String,
paint:Number,
package:Number,
painted:Number,
qacheck:Number,
qa:Number,
manufacture:Number
},{collection:'item-data'});

var itemmodel = mongoose.model('itemmodal',itemsch);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"max",saveUninitialized:false, resave:false}));

app.engine('hbs',hbs({extname:'hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
    return next();
    console.log('ok');
  }

  res.redirect('/login');
}


var userData = require(__dirname+'/user');


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
require('./passport')(passport);


// only to test chat sample code from sample
io.on('connection', function (socket) {
  console.log('socket connected');
socket.on('result',function(msg){
      boxmodel.findOne({type:msg},function(err,data){
        socket.emit('get',data.filled);
      });
    });


app.get('/nfc/:type',function(req,res){
boxmodel.findOne({type:req.params.type},function(err,data){
        socket.emit('get',data.filled);
      });
});

    socket.on('addinbox',function(datas){
      boxmodel.findOne({type:datas.box},function(err,data){
        var item=data.item;
        for(var i=0;i<item.length;i++){
          if(data.item[i].item==datas.item){
            if(data.item[i].qty>=data.filled[i].qty+parseInt(datas.qty)){
              data.filled[i].qty+= parseInt(datas.qty);
              //var check = track(datas.item,datas.comment,datas.qty);
                
  itemmodel.findOne({name:datas.item},function(err,dat){
    var query=datas.comment;
    var count =datas.qty;
    var flag=1;
    if(query=='manufacture'){
    dat[query]+=parseInt(count);
  }
  else if(query=='paint'){
    dat[query]+=parseInt(count);
    dat['manufacture']-=parseInt(count);
    if(dat['manufacture']<0){
      flag=0;
    }
  }
  else if(query=='painted'){
    dat[query]+=parseInt(count);
    dat['paint']-=parseInt(count);
    if(dat['paint']<0){
      flag=0;
    }
  }
  else if(query=='qa'){
    dat[query]+=parseInt(count);
    dat['painted']-=parseInt(count);
    if(dat['painted']<0){
      flag=0;
    }
  }
  else if(query=='qacheck'){
    dat[query]+=parseInt(count);
    dat['qa']-=parseInt(count);
    if(dat['qa']<0){
      flag=0;
    }
  }
  else if(query=='package'){
    //socket.emit('alert','something went wrong');
    flag=0;
  }
  if(flag==1){
    dat.save();
    data['comment']=query;
    data['last']='add';
    var hisjson = {
      from:query,
      to:data.type,
      qty:parseInt(count),
      date:new Date(),
      item:datas.item
    }
    hismodel(hisjson).save();

        data.save();
    socket.emit('alert','sucess');
  }
  else{
      socket.emit('alert','something went wrong');
      } 
  });

              
            }
            else{
              socket.emit('alert','check qty');
            }
          }
        }
      });
    });

    socket.on('emptybox',function(datas){
      boxmodel.findOne({type:datas.box},function(err,data){
  for(var i=0;i<data.item.length;i++){
          if(data.item[i].item==datas.item){
            if(data.filled[i].qty-parseInt(datas.qty)<data.item[i].qty && data.filled[i].qty-parseInt(datas.qty)>=0){
              data.filled[i].qty-=parseInt(datas.qty);
              //var check = track(datas.item,datas.comment,datas.qty);
                itemmodel.findOne({name:datas.item},function(err,dat){
    var query=datas.comment;
    var count =datas.qty;
    var flag=1;
    if(query=='manufacture'){
    dat[query]+=parseInt(count);
  }
  else if(query=='paint'){
    dat[query]+=parseInt(count);
    dat['manufacture']-=parseInt(count);
    if(dat['manufacture']<0){
      flag=0;
    }
  }
  else if(query=='painted'){
    dat[query]+=parseInt(count);
    dat['paint']-=parseInt(count);
    if(dat['paint']<0){
      flag=0;
    }
  }
  else if(query=='qa'){
    dat[query]+=parseInt(count);
    dat['painted']-=parseInt(count);
    if(dat['painted']<0){
      flag=0;
    }
  }
  else if(query=='qacheck'){
    dat[query]+=parseInt(count);
    dat['qa']-=parseInt(count);
    if(dat['qa']<0){
      flag=0;
    }
  }
  else if(query=='package'){
    dat[query]+=parseInt(count);
    dat['qacheck']-=parseInt(count);
    if(dat['qacheck']<0){
      flag=0;
    }
  }
  if(flag==1){
    dat.save();
    data['comment']=query;
    data['last']='empty';
    var hisjson = {
      from:data.type,
      to:query,
      qty:parseInt(count),
      date:new Date(),
      item:datas.item
    }
    hismodel(hisjson).save();
    data.save();
    socket.emit('alert','sucess');
  }
  else{
      socket.emit('alert','something went wrong');
      } 
  });
            }
            else{
              socket.emit('alert','check qty');
            }
          }
        }
      });
    });

      socket.on('disconnect',function(){
    console.log('socket disconnected');
  });
});

    app.get('/manage',function(req,res){
boxmodel.find({},function(err,data){
  res.render('manage',{var:data});
});
});

app.get('/delete/:box',function(req,res){
var type=req.params.box;
console.log(type);
boxmodel.findOne({type:type},function(err,data){
  console.log(data);
  var i,flag=0;
  for(i=0;i<data.filled;i++){
    if(data.filled[i].qty>0){
      boxmodel.find({},function(err,datas){
      res.render('/manage',{var:datas,msg:'box not empty'});
    });
      flag=1;
    }
  }
  if(flag==0){
    boxmodel.remove({ _id: data._id },function(err){
    if(err){
    console.log(err);
    }
    res.redirect('/manage');
  });
  }
});
});

app.get('/up/:box',function(req,res){
  boxmodel.findOne({type:req.params.box},function(err,data){
    res.render('upbox',{var:data,item:data.item});
  });
});

app.post('/delitembox',function(req,res){
  boxmodel.findOne({type:req.body.type},function(err,data){
    for(var i=0;i<data.filled.length;i++){
    if(data.filled[i].item==req.body.item){
      if(data.filled[i].qty>0){
     boxmodel.findOne({type:req.params.box},function(err,data){
    res.render('upbox',{var:data,item:data.item,msg:"item in box try after emptying it"});
  });
      break;
    }
    else{
      data.filled.splice(i,1);
      data.item.splice(i,1);
      data.save();
      res.redirect('/manage');
    }
  }
}
  });
});



app.get('/deleteitem',function(req,res){
  itemmodel.find({},function(err,data){
    res.render('delitem',{var:data});
  });
});

app.post('/delitem',function(req,res){
    boxmodel.find({},function(err,da){
      for(var j=0;j<da.length;j++){
        boxmodel.findOne({type:da[j].type},function(err,data){
    for(var i=0;i<data.filled.length;i++){
    if(data.filled[i].item==req.body.item){
      if(data.filled[i].qty>0){
     itemmodel.find({},function(err,dat){
    res.render('delitem',{var:dat,msg:"item in trolley"+ data[j]['type']+" try after emptying it"});
  });
      break;
    }
    else{
      data.filled.splice(i,1);
      data.item.splice(i,1);
      data.save();
    }
  }
}
  });
      }
    });
    itemmodel.findOne({name:req.body.item},function(err,datas){
      itemmodel.remove({ _id: datas._id },function(err){
    if(err){
    console.log(err);
  }
});
    });
    res.redirect('/');

  });

    
   



app.post('/additembox',function(req,res){

boxmodel.findOne({type:req.body.type},function(err,data){

var item = {
  item: req.body.item,
  qty:req.body.qty
}
console.log(data);
if(data.item.length==0 && data.filled.length == 0){
console.log('asd');
}
data.item.push(item);
item['qty']=0;
data.filled.push(item);
data.save();
});
res.redirect('/');
});




app.get('/',isLoggedIn,function(req,res){
  itemmodel.find({},function(err,data){
    res.render('home',{var:data});
  });
});


app.get('/login',function(req,res){
  res.render('login');
});

app.get('/his',function(req,res){
hismodel.find({},function(err,data){
   res.render('hist',{var:data}); 
});
});

app.post('/login',function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (user === false) {
      // handle login error ...
      res.render('login',{ message: req.flash('loginMessage') });
    } else {
      req.login(user, function(err) {
        // handle successful login ...
      console.log(user);
      res.redirect('/');
      
      });
      
    }
  })(req, res, next);
});

app.get('/signup',function(req,res){
  res.render('signup');
});


app.post('/signup',function(req,res){
userData.findOne({username:req.body.email},function(err,data){
if(err) return err;
if(data){
  res.render('signup',{message:'username taken'})
}
else{
var item = {
 username:req.body.email,
 pass:req.body.password
};
userData(item).save();
res.redirect('/login')
}
});
});


app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
  });

app.get('/add',function(req,res){
itemmodel.find({},function(err,data){
res.render('add',{var:data});
});
});

app.post('/add',function(req,res){
var itemjson={};
if(typeof(req.body.items) == 'string'){
var name = req.body.items.substr(0,req.body.items.indexOf(":"));
var qty = parseInt(req.body.items.substr(req.body.items.indexOf(":")+1));
var json = {
  'item' : name,
  'qty': qty
};
var filled = {
  'item' : name,
  'qty': 0
};
itemjson = {
type:req.body.type,
comment:'',
item:[],
filled:[]
};
itemjson.item.push(json);
itemjson.filled.push(filled);
}
else{
  itemjson = {
type:req.body.type,
item:[],
filled:[]
};
for(var i=0;i<req.body.items.length;i++){
 var name = req.body.items[i].substr(0,req.body.items[i].indexOf(":"));
var qty = parseInt(req.body.items[i].substr(req.body.items[i].indexOf(":")+1));
var json = {
  'item' : name,
  'qty': qty
};
var filled = {
  'item' : name,
  'qty': 0
};
itemjson.item.push(json);
itemjson.filled.push(filled); 
}
}

for(var i=1;i<=parseInt(req.body.count);i++){
itemjson['boxno']=i;
itemjson['type']+=i.toString();
boxmodel(itemjson).save();
itemjson['type']=req.body.type;
}
res.redirect('/');
});

app.get('/additem',function(req,res){
  res.render('additem');
});

app.post('/additem',function(req,res){
var json = {
  name: req.body.item,
  paint:0,
painted:0,
qacheck:0,
qa:0,
manufacture:0,
package:0
  
}
itemmodel(json).save();
res.redirect('/');
});

/*app.get('/addinbox/:name/:comment/:count',function(req,res){
  itemmodel.findOne({name:req.params.name},function(err,data){
    var query=req.params.comment;
    if(query=='manufacture'){
    data[query]+=parseInt(req.params.count);
  }
  else if(query=='paint'){
    data[query]+=parseInt(req.params.count);
    data['manufacture']-=parseInt(req.params.count);
  }
  else if(query=='painted'){
    data[query]+=parseInt(req.params.count);
    data['paint']-=parseInt(req.params.count);
  }
  else if(query=='qa'){
    data[query]+=parseInt(req.params.count);
    data['painted']-=parseInt(req.params.count);
  }
  else if(query=='qacheck'){
    data[query]+=parseInt(req.params.count);
    data['qa']-=parseInt(req.params.count);
  }
  data.save();
  req.end('done');
  });
});*/

var flag;
function track(name,comment,count){
  flag=1;
  itemmodel.findOne({name:name},function(err,data){
    var query=comment;
    if(query=='manufacture'){
    data[query]+=parseInt(count);
  }
  else if(query=='paint'){
    data[query]+=parseInt(count);
    data['manufacture']-=parseInt(count);
    if(data['manufacture']<0){
      flag=0;
    }
  }
  else if(query=='painted'){
    data[query]+=parseInt(count);
    data['paint']-=parseInt(count);
    if(data['paint']<0){
      flag=0;
    }
  }
  else if(query=='qa'){
    data[query]+=parseInt(count);
    data['painted']-=parseInt(count);
    if(data['painted']<0){
      flag=0;
    }
  }
  else if(query=='qacheck'){
    data[query]+=parseInt(count);
    data['qa']-=parseInt(count);
    if(data['qa']<0){
      flag=0;
    }
  }
  if(flag==1){
    data.save();
  }
  });
  if(flag==1){
    return true;
  }
  else{
    return false;
  }
}


