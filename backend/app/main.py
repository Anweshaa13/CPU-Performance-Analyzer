import os, uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, String, DateTime, Float, Integer, JSON, ForeignKey, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session, sessionmaker
from jose import jwt, JWTError
from passlib.context import CryptContext

DATABASE_URL=os.getenv('DATABASE_URL','sqlite:///./cpu_performance_analyzer.db')
JWT_SECRET=os.getenv('JWT_SECRET','cpu_performance_analyzer-dev-secret-change-me')
ALGO='HS256'
MINUTES=int(os.getenv('ACCESS_TOKEN_MINUTES','1440'))
ORIGINS=os.getenv('FRONTEND_ORIGIN','http://localhost:5173').split(',')
connect_args={'check_same_thread':False} if DATABASE_URL.startswith('sqlite') else {}
engine=create_engine(DATABASE_URL,connect_args=connect_args)
SessionLocal=sessionmaker(bind=engine,autocommit=False,autoflush=False)
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__='users'; id:Mapped[str]=mapped_column(String,primary_key=True,default=lambda:str(uuid.uuid4())); name:Mapped[str]=mapped_column(String(120)); email:Mapped[str]=mapped_column(String(255),unique=True,index=True); password_hash:Mapped[str]=mapped_column(String(255)); created_at:Mapped[datetime]=mapped_column(DateTime,default=lambda:datetime.now(timezone.utc)); runs=relationship('Run',back_populates='user',cascade='all, delete-orphan')
class Run(Base):
    __tablename__='runs'; id:Mapped[str]=mapped_column(String,primary_key=True,default=lambda:str(uuid.uuid4())); user_id:Mapped[str]=mapped_column(ForeignKey('users.id')); created_at:Mapped[datetime]=mapped_column(DateTime,default=lambda:datetime.now(timezone.utc)); cpu_label:Mapped[str]=mapped_column(String(255)); browser:Mapped[str]=mapped_column(String(500)); os_label:Mapped[str]=mapped_column(String(120)); logical_cores:Mapped[int]=mapped_column(Integer,default=0); overall_score:Mapped[float]=mapped_column(Float); categories:Mapped[dict]=mapped_column(JSON); benchmark_version:Mapped[str]=mapped_column(String(80)); input_config:Mapped[dict]=mapped_column(JSON); user=relationship('User',back_populates='runs')
Base.metadata.create_all(engine)
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto'); oauth=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
app=FastAPI(title='CPU Performance Analyzer API',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=ORIGINS,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
def db():
    s=SessionLocal()
    try: yield s
    finally: s.close()
def token_for(u:User): return jwt.encode({'sub':u.id,'exp':datetime.now(timezone.utc)+timedelta(minutes=MINUTES)},JWT_SECRET,algorithm=ALGO)
def current_user(token:str=Depends(oauth),s:Session=Depends(db)):
    try: uid=jwt.decode(token,JWT_SECRET,algorithms=[ALGO]).get('sub')
    except JWTError: raise HTTPException(401,'Invalid or expired token')
    u=s.get(User,uid)
    if not u: raise HTTPException(401,'User not found')
    return u
class Register(BaseModel): name:str=Field(min_length=2,max_length=120); email:EmailStr; password:str=Field(min_length=6,max_length=128)
class Login(BaseModel): email:EmailStr; password:str
class RunIn(BaseModel): cpu_label:str; browser:str; os_label:str; logical_cores:int=0; overall_score:float; categories:dict; benchmark_version:str; input_config:dict
class UserOut(BaseModel): id:str; name:str; email:EmailStr
class TokenOut(BaseModel): access_token:str; token_type:str='bearer'; user:UserOut

def out_user(u:User): return {'id':u.id,'name':u.name,'email':u.email}
@app.get('/api/health')
def health(): return {'status':'ok','service':'CPU Performance Analyzer API','database':True}
@app.post('/api/auth/register',response_model=TokenOut)
def register(x:Register,s:Session=Depends(db)):
    email=x.email.lower();
    if s.scalar(select(User).where(User.email==email)): raise HTTPException(409,'An account with this email already exists')
    u=User(name=x.name,email=email,password_hash=pwd.hash(x.password));s.add(u);s.commit();s.refresh(u);return {'access_token':token_for(u),'user':out_user(u)}
@app.post('/api/auth/login',response_model=TokenOut)
def login(x:Login,s:Session=Depends(db)):
    u=s.scalar(select(User).where(User.email==x.email.lower()))
    if not u or not pwd.verify(x.password,u.password_hash): raise HTTPException(401,'Incorrect email or password')
    return {'access_token':token_for(u),'user':out_user(u)}
@app.get('/api/auth/me',response_model=UserOut)
def me(u:User=Depends(current_user)): return out_user(u)
@app.get('/api/runs')
def list_runs(u:User=Depends(current_user),s:Session=Depends(db)):
    rows=s.scalars(select(Run).where(Run.user_id==u.id).order_by(Run.created_at.desc())).all()
    return [run_dict(r) for r in rows]
@app.post('/api/runs')
def create_run(x:RunIn,u:User=Depends(current_user),s:Session=Depends(db)):
    r=Run(user_id=u.id,**x.model_dump());s.add(r);s.commit();s.refresh(r);return run_dict(r)
@app.delete('/api/runs/{run_id}',status_code=204)
def delete_run(run_id:str,u:User=Depends(current_user),s:Session=Depends(db)):
    r=s.scalar(select(Run).where(Run.id==run_id,Run.user_id==u.id));
    if not r: raise HTTPException(404,'Run not found')
    s.delete(r);s.commit();return None
def run_dict(r:Run): return {'id':r.id,'created_at':r.created_at.isoformat(),'cpu_label':r.cpu_label,'browser':r.browser,'os_label':r.os_label,'logical_cores':r.logical_cores,'overall_score':r.overall_score,'categories':r.categories,'benchmark_version':r.benchmark_version,'input_config':r.input_config}
