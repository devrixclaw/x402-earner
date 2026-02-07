const express=require('express');const app=express();
const W="8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs";
app.get('/:x',(r,s)=>s.set('x402',"x402:addr:"+W+";amount:"+(r.params.x==="debug"?8000000:5000000)).json({wallet:W,price:r.params.x==="debug"?8:5,auto:true}));
app.listen(process.env.PORT||4000);
setInterval(console.log,900000,"💰 Auto USDC →",W);