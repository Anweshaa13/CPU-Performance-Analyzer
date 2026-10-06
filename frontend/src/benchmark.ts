export type Category = 'Integer'|'Floating Point'|'Matrix'|'Memory'|'Multithread';
export type BenchCategory={score:number;duration_ms:number;throughput:number;unit:string;speedup?:number;efficiency?:number};
export type BenchResult={cpu_label:string;browser:string;os_label:string;logical_cores:number;overall_score:number;categories:Record<Category,BenchCategory>;benchmark_version:string;input_config:Record<string,unknown>};
const median=(a:number[])=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
const timed=(fn:()=>number,reps=3)=>{const vals:number[]=[];for(let i=0;i<reps;i++){const t=performance.now();fn();vals.push(performance.now()-t)}return median(vals)};
function integerWork(n=1_500_000){let x=0;for(let i=0;i<n;i++){x=(Math.imul(x+17,i+3)^((x<<5)|(x>>>27)))|0;x=(x+((i*31)&0xffff))|0}return x}
function floatWork(n=900_000){let x=1.001;for(let i=0;i<n;i++){x=Math.fround(x*1.0000001+0.00001);if((i&8191)===0)x=Math.sqrt(Math.abs(x))+0.1}return x}
function matrixWork(n=128){const a=new Float64Array(n*n),b=new Float64Array(n*n),c=new Float64Array(n*n);for(let i=0;i<a.length;i++){a[i]=(i%17)*0.01;b[i]=(i%13)*0.02}for(let i=0;i<n;i++)for(let k=0;k<n;k++){const av=a[i*n+k];for(let j=0;j<n;j++)c[i*n+j]+=av*b[k*n+j]}return c[0]}
function memoryWork(bytes=8*1024*1024){const src=new Uint8Array(bytes),dst=new Uint8Array(bytes);for(let i=0;i<bytes;i+=4096)src[i]=(i/4096)&255;dst.set(src);return dst[0]}
function threadJob(n=220_000){let x=1;for(let i=0;i<n;i++)x=x*1.0000001+0.00001;return x}
export async function runBrowserBenchmark(machineName='My Laptop', onProgress?:(name:string,p:number)=>void):Promise<BenchResult>{
 const configs={matrix:128,memoryMB:8,repetitions:3,threads:Math.min(4,Math.max(2,navigator.hardwareConcurrency||4))};
 const tests:[Category,()=>number,number,string][]=[['Integer',()=>integerWork(),1500000,'ops/s'],['Floating Point',()=>floatWork(),900000,'ops/s'],['Matrix',()=>matrixWork(configs.matrix),2*configs.matrix**3,'ops/s'],['Memory',()=>memoryWork(configs.memoryMB*1024*1024),configs.memoryMB*1024*1024,'GB/s']];
 const cats:any={}; tests.forEach(([name,fn,ops,unit],idx)=>{onProgress?.(name,idx*20+10);fn();const ms=timed(fn,configs.repetitions);cats[name]={score:0,duration_ms:ms,throughput:ops/(ms/1000),unit}});
 onProgress?.('Multithread',90); const single=timed(()=>threadJob(),configs.repetitions); const parallel=timed(()=>{for(let i=0;i<configs.threads;i++)threadJob()},configs.repetitions); const speedup=single/parallel; cats['Multithread']={score:0,duration_ms:parallel,throughput:configs.threads*220000/(parallel/1000),unit:'ops/s',speedup,efficiency:speedup/configs.threads};
// Convert measured execution times into normalized 0–100 scores.
// Lower execution time = better performance.
// The fastest workload receives 100, while slower workloads receive
// proportionally lower scores.

const durations = Object.values(cats).map(
  (x: any) => x.duration_ms
);

const maxDuration = Math.max(...durations);
const minDuration = Math.min(...durations);

Object.values(cats).forEach((x: any) => {
  // Normalize each workload independently.
  // This prevents raw throughput values from being displayed as /100 scores.
  const normalized =
    minDuration === maxDuration
      ? 100
      : (minDuration / x.duration_ms) * 100;

  x.score = Math.round(
    Math.max(0, Math.min(100, normalized)) * 10
  ) / 10;
});

// Equal weighting across the five benchmark categories.
const categoryScores = Object.values(cats).map(
  (x: any) => x.score
);

const overall =
  categoryScores.reduce(
    (sum: number, score: number) => sum + score,
    0
  ) / categoryScores.length;

// Final safety limit: overall score can NEVER exceed 100.
const normalizedOverall = Math.max(
  0,
  Math.min(100, overall)
);
 onProgress?.('Complete',100); return {cpu_label:`Browser CPU (${navigator.hardwareConcurrency||'unknown'} logical cores)`,browser:navigator.userAgent,os_label:navigator.platform,logical_cores:navigator.hardwareConcurrency||0,overall_score: Math.round(normalizedOverall * 10) / 10,categories:cats,benchmark_version:'CPUA-2.0-browser',input_config:{...configs,machine_name:machineName.trim()||'My Laptop'}};
}
