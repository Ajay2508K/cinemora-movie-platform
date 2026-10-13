import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers={ "Access-Control-Allow-Origin":Deno.env.get("SITE_ORIGIN")??"https://YOUR-SITE-DOMAIN.example","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store" };
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{...headers,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const origin=req.headers.get("origin"),site=Deno.env.get("SITE_ORIGIN");if(!site)return json({error:"SITE_ORIGIN is not configured"},500);if(origin!==site)return json({error:"Origin not allowed"},403);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anon||!service)return json({error:"Server is not configured"},500);
 const auth=req.headers.get("Authorization")??"";if(!auth.startsWith("Bearer "))return json({error:"Sign-in required"},401);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
 const {data:{user},error:userError}=await userClient.auth.getUser();if(userError||!user)return json({error:"Invalid session"},401);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:profile}=await admin.from("user_profiles").select("role").eq("user_id",user.id).maybeSingle();if(profile?.role!=="admin")return json({error:"Admin permission required"},403);
 let b:{fileName?:string;contentType?:string;size?:number};try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
 const types=new Set(["video/mp4","video/webm","video/quicktime","application/vnd.apple.mpegurl","video/mp2t","image/jpeg","image/png","image/webp"]),max=Number(Deno.env.get("MAX_UPLOAD_BYTES")??52428800);
 if(!Number.isSafeInteger(b.size)||b.size!<1||b.size!>max)return json({error:"File size exceeds configured limit"},413);
 if(!b.contentType||!types.has(b.contentType))return json({error:"Unsupported media type"},415);
 const name=(b.fileName??"media").normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100),path=user.id+"/"+crypto.randomUUID()+"-"+name;
 const {data,error}=await admin.storage.from("cinemora-media").createSignedUploadUrl(path,{upsert:false});if(error||!data)return json({error:"Unable to create upload URL"},500);
 return json({path,token:data.token,signedUrl:data.signedUrl,expiresIn:7200});
});
