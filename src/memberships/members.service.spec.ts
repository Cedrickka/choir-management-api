import { NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
describe('MembersService',()=>{
  it('archives a membership without deleting its history',async()=>{const prisma:any={membership:{findFirst:jest.fn().mockResolvedValue({id:'m'}),update:jest.fn().mockResolvedValue({})}};const service=new MembersService(prisma);await expect(service.archive('choir-a','m')).resolves.toEqual({archived:true});expect(prisma.membership.update).toHaveBeenCalledWith({where:{id:'m'},data:{status:'INACTIVE',archivedAt:expect.any(Date)}});expect(prisma.membership.delete).toBeUndefined();});
  it('does not expose a membership from another choir',async()=>{const prisma:any={membership:{findFirst:jest.fn().mockResolvedValue(null)}};await expect(new MembersService(prisma).get('choir-a','member-b')).rejects.toThrow(NotFoundException);expect(prisma.membership.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({choirId:'choir-a'})}));});
});
