const cors={ "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS", "Vary":"Origin", "Cache-Control":"no-store" };
const b64url=(bytes:Uint8Array)=>btoa(Array.from(bytes,x=>String.fromCharCode(x)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
Deno.serve(async (req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return Response.json({success:false,error:"Method not allowed"},{status:405,headers:cors});
 const origin=req.headers.get("origin"),expected=Deno.env.get("SITE_ORIGIN");
 if(!expected || origin!==expected) return Response.json({success:false,error:"Origin not allowed"},{status:403,headers:cors});
 const secret=Deno.env.get("TURNSTILE_SECRET_KEY"),sessionSecret=Deno.env.get("CAPTCHA_SESSION_SECRET");
 if(!secret||!sessionSecret) return Response.json({success:false,error:"CAPTCHA is not configured"},{status:503,headers:cors});
 try{
  const body=await req.json(),token=typeof body?.token==="string"?body.token:"";
  if(!token||token.length>2048) return Response.json({success:false,error:"Missing verification token"},{status:400,headers:cors});
  const form=new URLSearchParams({secret,response:token}),ip=req.headers.get("cf-connecting-ip");if(ip)form.set("remoteip",ip);
  const check=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:form});
  const result=await check.json();
  if(!result.success||result.hostname!==new URL(expected).hostname) return Response.json({success:false,error:"Human verification failed"},{status:403,headers:cors});
  const claims={host:new URL(expected).hostname,exp:Date.now()+30*60*1000},payload=b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(sessionSecret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
  return Response.json({success:true,sessionToken:payload+"."+b64url(sig),expiresAt:claims.exp},{headers:cors});
 }catch{return Response.json({success:false,error:"Invalid verification request"},{status:400,headers:cors});}
});
