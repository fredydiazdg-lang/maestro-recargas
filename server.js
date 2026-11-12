const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,PASS=process.env.ADMIN_PASS||'cambia-esto',TG=process.env.TG_TOKEN,TGC=process.env.TG_CHAT;
// Consulta NO oficial del apodo. Si deja de funcionar, cambia NICK_API_URL.
const NICK_URL=process.env.NICK_API_URL||'https://shop.garena.sg/api/auth/player_id_login';
const DATA=process.env.DATA_DIR||__dirname,OF=path.join(DATA,'orders.json'),CF=path.join(DATA,'config.json');
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return d}};
const wr=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,1));
const RX=/(<script type="application\/json" id="cfg">)([\s\S]*?)(<\/script>)/;
const page=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
const defCfg=JSON.parse(page.match(RX)[2]);
const cfg=()=>rd(CF,defCfg);
const body=req=>new Promise(r=>{let b='';req.on('data',c=>{b+=c;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b))}catch{r({})}})});
const send=(res,c,o,t='application/json')=>{res.writeHead(c,{'Content-Type':t+'; charset=utf-8'});res.end(typeof o==='string'?o:JSON.stringify(o))};
const hits={};
const limited=ip=>{const n=Date.now(),a=(hits[ip]||[]).filter(t=>n-t<60000);a.push(n);hits[ip]=a;return a.length>12};
const clean=v=>String(v||'').replace(/[\r\n]+/g,' ').slice(0,80);
async function tg(text){if(!TG||!TGC)return;try{await fetch(`https://api.telegram.org/bot${TG}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:TGC,text})})}catch(e){console.log('telegram:',e.message)}}
async function nick(id){
 const r=await fetch(NICK_URL,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},body:JSON.stringify({app_id:100067,login_id:String(id)})});
 const j=await r.json();return j.nickname||(j.data&&j.data.nickname)||null}
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x'),ip=req.headers['x-forwarded-for']||req.socket.remoteAddress,adm=req.headers['x-admin']===PASS;
 try{
 if(u.pathname==='/')return send(res,200,page.replace(RX,(m,a,b,c)=>a+JSON.stringify(cfg()).replace(/</g,'\\u003c')+c),'text/html');
 if(u.pathname==='/admin')return send(res,200,fs.readFileSync(path.join(__dirname,'public/admin.html'),'utf8'),'text/html');
 if(u.pathname==='/api/nick'){if(limited(ip))return send(res,429,{});const id=u.searchParams.get('id')||'';if(!/^\d{5,14}$/.test(id))return send(res,400,{});let n=null;try{n=await nick(id)}catch(e){console.log('nick:',e.message)}return send(res,200,{nick:n})}
 if(u.pathname==='/api/order'&&req.method==='POST'){if(limited(ip))return send(res,429,{});const b=await body(req);
  if(!/^\d{5,14}$/.test(String(b.uid||'')))return send(res,400,{error:'id'});
  const o={id:Date.now().toString(36),ts:Date.now(),status:'pendiente',game:clean(b.game),pack:clean(b.pack),price:clean(b.price),uid:clean(b.uid),nick:clean(b.nick),pay:clean(b.pay)};
  const L=rd(OF,[]);L.push(o);wr(OF,L.slice(-2000));
  tg(`🛒 Nuevo pedido\n${o.pack} · ${o.price} (${o.game})\nID: ${o.uid}\nNombre: ${o.nick}\nPago: ${o.pay}`);
  return send(res,200,{ok:true})}
 if(u.pathname.startsWith('/api/')&&!adm)return send(res,401,{error:'auth'});
 if(u.pathname==='/api/orders')return send(res,200,rd(OF,[]).reverse());
 if(u.pathname==='/api/status'&&req.method==='POST'){const b=await body(req);const L=rd(OF,[]);const o=L.find(x=>x.id===b.id);if(o&&['pendiente','pagado','entregado'].includes(b.status))o.status=b.status;wr(OF,L);return send(res,200,{ok:true})}
 if(u.pathname==='/api/config'){if(req.method==='POST'){wr(CF,await body(req));return send(res,200,{ok:true})}return send(res,200,cfg())}
 send(res,404,'No encontrado','text/plain');
 }catch(e){console.log(e);send(res,500,{error:'server'})}
}).listen(PORT,()=>console.log('Maestro Recargas en http://localhost:'+PORT));
