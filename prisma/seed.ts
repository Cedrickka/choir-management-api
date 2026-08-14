import { PrismaClient, OrganizationType } from '@prisma/client'; import bcrypt from 'bcryptjs';
const prisma=new PrismaClient();
const permissions=['members.read','members.create','members.update','attendance.scan','attendance.correct','finance.read','finance.manage','music.read','music.manage','announcements.manage'];
const roles=['ADMIN','PRESIDENT','SECRETARY','MAESTRO','TREASURER','ATTENDANCE_CONTROLLER','SECTION_LEADER','MEMBER'];
async function main(){
 const organization=await prisma.organization.upsert({where:{id:'11111111-1111-4111-8111-111111111111'},update:{},create:{id:'11111111-1111-4111-8111-111111111111',name:'CSJB Organization',type:OrganizationType.CHOIR}});
 const choir=await prisma.choir.upsert({where:{slug:'choeur-saint-jean-bosco'},update:{},create:{organizationId:organization.id,name:'Chœur Saint Jean Bosco',slug:'choeur-saint-jean-bosco',timezone:'Africa/Kinshasa'}});
 await Promise.all(['Soprano','Alto','Ténor','Basse'].map(name=>prisma.voiceSection.upsert({where:{choirId_name:{choirId:choir.id,name}},update:{},create:{choirId:choir.id,name}})));
 for(const code of permissions)await prisma.permission.upsert({where:{code},update:{},create:{code}});
 const roleRows:any={};for(const code of roles)roleRows[code]=await prisma.role.upsert({where:{organizationId_code:{organizationId:organization.id,code}},update:{},create:{organizationId:organization.id,code,name:code,isSystem:true}});
 const all=await prisma.permission.findMany();for(const p of all)await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:roleRows.ADMIN.id,permissionId:p.id}},update:{},create:{roleId:roleRows.ADMIN.id,permissionId:p.id}});
 const read=all.find(p=>p.code==='members.read')!;await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:roleRows.MEMBER.id,permissionId:read.id}},update:{},create:{roleId:roleRows.MEMBER.id,permissionId:read.id}});
 const demos=[['admin@csjb.local','Administrateur','CSJB','ADMIN'],['maestro@csjb.local','Maestro','CSJB','MAESTRO'],['tresorier@csjb.local','Trésorier','CSJB','TREASURER'],['secretaire@csjb.local','Secrétaire','CSJB','SECRETARY'],['membre1@csjb.local','Jean','Membre','MEMBER'],['membre2@csjb.local','Marie','Membre','MEMBER']];
 const passwordHash=await bcrypt.hash('Demo-CSJB-2026!',12);for(const [email,firstName,lastName,role] of demos){const user=await prisma.user.upsert({where:{email},update:{},create:{email,firstName,lastName,passwordHash}});const membership=await prisma.membership.upsert({where:{userId_choirId:{userId:user.id,choirId:choir.id}},update:{},create:{userId:user.id,choirId:choir.id}});await prisma.membershipRole.upsert({where:{membershipId_roleId:{membershipId:membership.id,roleId:roleRows[role].id}},update:{},create:{membershipId:membership.id,roleId:roleRows[role].id}});}
}
main().finally(()=>prisma.$disconnect());
