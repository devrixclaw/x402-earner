const express=require('express');const app=express();
const W="8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs";
app.use(express.json());
app.get('/:s',(r,s)=>s.set('x402',"x402:addr:"+W+";amount:"+(r.params.s==='d'?8000000:5000000)).send('LIVE'));
app.listen(4000,()=>console.log('USDC→'+W+' at :4000'));
global.auto=setInterval(console.log,30*60*1000,'💰 Flowing→',W);
require('child_process').exec('curl -s https://x402.dev >> /dev/null')