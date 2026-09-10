const $ = id => document.getElementById(id);
const SUITS = ["♠","♥","♦","♣"], RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
let peer=null, conn=null, isHost=false, myId="", roomCode="", state=null, connections={};

function makeRoomCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
function deck(){ let d=[]; for(const s of SUITS) for(const r of RANKS)d.push({s,r}); return d.sort(()=>Math.random()-.5); }
function cardValue(c){ if(c.r==="A")return 11; if(["J","Q","K"].includes(c.r))return 10; return +c.r; }
function score(hand){ let n=hand.reduce((a,c)=>a+cardValue(c),0), ac=hand.filter(c=>c.r==="A").length; while(n>21&&ac--)n-=10; return n; }
function blackjack(h){return h.length===2 && h.some(c=>c.r==="A") && h.some(c=>["10","J","Q","K"].includes(c.r));}
function safeName(v){return (v||"Người chơi").trim().slice(0,20)||"Người chơi"}

function initialState(host){
  return {room:roomCode,dealer:{name:host.name,hand:[]},players:[host],deck:deck(),phase:"lobby",message:"Đang chờ người chơi vào phòng."};
}
function cardHTML(c, hidden=false){
  if(hidden)return '<div class="card back">🂠</div>';
  const red=["♥","♦"].includes(c.s);
  return `<div class="card ${red?"red":""}"><div>${c.r}</div><div>${c.s}</div></div>`;
}
function render(){
  if(!state)return;
  $("roomCodeView").textContent=roomCode;
  $("roleView").textContent=isHost?"CÁI / CHỦ PHÒNG":"NGƯỜI CHƠI";
  $("dealerName").textContent=state.dealer.name;
  $("dealerCards").innerHTML=state.dealer.hand.map((c,i)=>cardHTML(c,!isHost&&state.phase==="playing"&&i===1)).join("");
  $("dealerScore").textContent=(state.phase==="lobby"||state.phase==="playing"&&!isHost)?"":`Điểm: ${score(state.dealer.hand)}`;
  $("players").innerHTML=state.players.map(p=>{
    const mine=p.id===myId;
    const s=p.hand?.length ? score(p.hand) : "";
    return `<div class="player ${mine?"me":""}">
      <div class="playerName">${mine?"⭐ ":""}${escapeHtml(p.name)} ${p.stood?"— Đã dằn":""}</div>
      <div class="state">${p.status||"Đang chờ"}${s!==""?" · Điểm: "+s:""}</div>
      <div class="cards">${(p.hand||[]).map(c=>cardHTML(c)).join("")}</div>
      ${p.result?`<div class="state"><b>${p.result}</b></div>`:""}
    </div>`;
  }).join("");
  $("hostControls").classList.toggle("hidden",!isHost);
  $("playerControls").classList.toggle("hidden",isHost||state.phase!=="playing");
  $("hitBtn").disabled=!state.players.find(p=>p.id===myId)?.active;
  $("standBtn").disabled=!state.players.find(p=>p.id===myId)?.active;
  $("startBtn").disabled=!isHost||state.players.length<1||state.phase==="playing";
  $("status").textContent=state.message||"";
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function broadcast(){
  Object.values(connections).forEach(c=>{try{c.send({type:"state",state})}catch(e){}}); render();
}
function hostHandle(c){
  connections[c.peer]=c;
  c.on("data",m=>{
    if(m.type==="join"){
      if(state.players.some(p=>p.id===c.peer))return;
      state.players.push({id:c.peer,name:safeName(m.name),hand:[],status:"Đã vào phòng",active:false,stood:false,result:""});
      c.send({type:"state",state});
      broadcast();
    }
    if(m.type==="action"){
      const p=state.players.find(x=>x.id===c.peer); if(!p)return;
      if(m.action==="hit"&&state.phase==="playing"&&p.active){
        p.hand.push(state.deck.pop());
        if(score(p.hand)>=21){p.active=false;p.stood=true}
        checkAllDone();
        broadcast();
      }
      if(m.action==="stand"&&state.phase==="playing"&&p.active){p.active=false;p.stood=true;checkAllDone();broadcast();}
    }
  });
  c.on("close",()=>{delete connections[c.peer];state.players=state.players.filter(p=>p.id!==c.peer);broadcast();});
}
function checkAllDone(){
  if(state.players.every(p=>!p.active)) finishRound();
}
function finishRound(){
  while(score(state.dealer.hand)<17)state.dealer.hand.push(state.deck.pop());
  const ds=score(state.dealer.hand), db=blackjack(state.dealer.hand);
  state.players.forEach(p=>{
    const ps=score(p.hand), pb=blackjack(p.hand);
    if(ps>21)p.result="💥 Quắc — thua";
    else if(pb&&!db)p.result="🃏 Xì dách — thắng";
    else if(db&&!pb)p.result="Cái có Xì dách — thua";
    else if(ps>ds)p.result="🏆 Thắng";
    else if(ps===ds)p.result="🤝 Hòa";
    else p.result="❌ Thua";
  });
  state.phase="finished"; state.message="Ván kết thúc. Chủ phòng có thể bấm “Ván mới”.";
}
function startRound(){
  state.deck=deck();state.dealer.hand=[state.deck.pop(),state.deck.pop()];
  state.players.forEach(p=>{p.hand=[state.deck.pop(),state.deck.pop()];p.active=true;p.stood=false;p.result="";p.status="Đang chơi"});
  state.phase="playing";state.message="Mọi người lần lượt Rút hoặc Dằn.";
  broadcast();
}
function newRound(){
  state.deck=deck();state.dealer.hand=[];state.players.forEach(p=>{p.hand=[];p.active=false;p.stood=false;p.result="";p.status="Đang chờ"});state.phase="lobby";state.message="Sẵn sàng ván mới.";broadcast();
}

$("createBtn").onclick=()=>{
  const name=safeName($("hostName").value); isHost=true; roomCode=makeRoomCode(); myId="HOST-"+roomCode;
  peer=new Peer(roomCode);
  peer.on("open",()=>{state=initialState({id:myId,name,hand:[],status:"Cái / Chủ phòng",active:false,stood:false,result:""});$("home").classList.add("hidden");$("room").classList.remove("hidden");render();});
  peer.on("connection",hostHandle);
  peer.on("error",e=>{$("homeMsg").textContent="Không tạo được phòng: "+e.type});
};
$("joinBtn").onclick=()=>{
  const name=safeName($("joinName").value), code=$("roomCode").value.trim().toUpperCase();
  if(!code){$("homeMsg").textContent="Nhập mã phòng.";return}
  isHost=false;roomCode=code;peer=new Peer();
  peer.on("open",id=>{myId=id;conn=peer.connect(code,{reliable:true});
    conn.on("open",()=>{conn.send({type:"join",name});});
    conn.on("data",m=>{if(m.type==="state"){state=m.state;$("home").classList.add("hidden");$("room").classList.remove("hidden");render();}});
    conn.on("close",()=>{$("status").textContent="Mất kết nối với Cái."});
    conn.on("error",()=>{$("homeMsg").textContent="Không thể vào phòng. Kiểm tra mã phòng."});
  });
  peer.on("error",e=>{$("homeMsg").textContent="Không thể vào phòng: "+e.type});
};
$("startBtn").onclick=()=>startRound();
$("resetBtn").onclick=()=>newRound();
$("hitBtn").onclick=()=>{conn?.send({type:"action",action:"hit"})};
$("standBtn").onclick=()=>{conn?.send({type:"action",action:"stand"})};
$("copyBtn").onclick=async()=>{
  const url=location.href.split("?")[0]+"?room="+roomCode;
  try{await navigator.clipboard.writeText(url);$("status").textContent="Đã sao chép link mời: "+url}
  catch(e){prompt("Copy link mời:",url)}
};
const q=new URLSearchParams(location.search).get("room");
if(q){$("roomCode").value=q.toUpperCase();}
