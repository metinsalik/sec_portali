"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// TÃ¼m settings rotalarÄ± kimlik doÄŸrulama gerektirir
router.use(auth_1.authMiddleware);
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// YARDIMCI FONKSÄ°YONLAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function ensureRolesExist() {
    const roleNames = ['admin', 'management', 'user', 'safety', 'doctor', 'dsp'];
    for (const name of roleNames) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TESÄ°S YÃ–NETÄ°MÄ° â€” Admin + Management
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/facilities', async (req, res) => {
    try {
        const facilities = await prisma.facility.findMany({
            include: { buildings: true },
            orderBy: { id: 'asc' },
        });
        res.json(facilities);
    }
    catch {
        res.status(500).json({ error: 'Tesisler getirilemedi.' });
    }
});
router.post('/facilities', auth_1.managementMiddleware, async (req, res) => {
    const { id, name, shortName, type, city, district, fullAddress, phone, email, website, commercialTitle, taxOffice, taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, buildings } = req.body;
    if (!id || !name) {
        return res.status(400).json({ error: 'Tesis kodu ve adÄ± zorunludur.' });
    }
    try {
        const facility = await prisma.facility.create({
            data: {
                id,
                name,
                shortName,
                type,
                city,
                district,
                fullAddress,
                phone,
                email,
                website,
                commercialTitle,
                taxOffice,
                taxNumber,
                sgkNumber,
                naceCode,
                dangerClass: dangerClass || 'Az Tehlikeli',
                employeeCount: employeeCount ? parseInt(String(employeeCount)) : 0,
                buildings: {
                    create: buildings?.map((b) => ({
                        name: b.name,
                        constructionYear: b.constructionYear ? parseInt(String(b.constructionYear)) : null,
                        buildingHeight: b.buildingHeight ? parseFloat(String(b.buildingHeight)) : null,
                        structureHeight: b.structureHeight ? parseFloat(String(b.structureHeight)) : null,
                        buildingFloors: b.buildingFloors ? parseInt(String(b.buildingFloors)) : null,
                        structureFloors: b.structureFloors ? parseInt(String(b.structureFloors)) : null,
                        closedArea: b.closedArea ? parseFloat(String(b.closedArea)) : null,
                        parkingArea: b.parkingArea ? parseFloat(String(b.parkingArea)) : null,
                        gardenArea: b.gardenArea ? parseFloat(String(b.gardenArea)) : null,
                        bedCapacity: b.bedCapacity ? parseInt(String(b.bedCapacity)) : null,
                    })) ?? [],
                },
            },
            include: { buildings: true },
        });
        res.status(201).json(facility);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tesis oluÅŸturulamadÄ±.' });
    }
});
router.put('/facilities/:id', auth_1.managementMiddleware, async (req, res) => {
    const id = String(req.params.id);
    const { name, shortName, type, city, district, fullAddress, phone, email, website, commercialTitle, taxOffice, taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, isActive, buildings } = req.body;
    try {
        // Ã–nce mevcut binalarÄ± silelim (veya gÃ¼ncelleyelim, ama silip yeniden oluÅŸturmak daha basit ÅŸimdilik)
        if (buildings !== undefined) {
            await prisma.facilityBuilding.deleteMany({ where: { facilityId: id } });
        }
        const facility = await prisma.facility.update({
            where: { id },
            data: {
                name, shortName, type, city, district, fullAddress,
                phone, email, website, commercialTitle, taxOffice,
                taxNumber, sgkNumber, naceCode, dangerClass,
                employeeCount: employeeCount ? parseInt(String(employeeCount)) : 0,
                isActive,
                buildings: buildings !== undefined ? {
                    create: buildings?.map((b) => ({
                        name: b.name,
                        constructionYear: b.constructionYear ? parseInt(String(b.constructionYear)) : null,
                        buildingHeight: b.buildingHeight ? parseFloat(String(b.buildingHeight)) : null,
                        structureHeight: b.structureHeight ? parseFloat(String(b.structureHeight)) : null,
                        buildingFloors: b.buildingFloors ? parseInt(String(b.buildingFloors)) : null,
                        structureFloors: b.structureFloors ? parseInt(String(b.structureFloors)) : null,
                        closedArea: b.closedArea ? parseFloat(String(b.closedArea)) : null,
                        parkingArea: b.parkingArea ? parseFloat(String(b.parkingArea)) : null,
                        gardenArea: b.gardenArea ? parseFloat(String(b.gardenArea)) : null,
                        bedCapacity: b.bedCapacity ? parseInt(String(b.bedCapacity)) : null,
                    })) ?? [],
                } : undefined,
            },
            include: { buildings: true },
        });
        res.json(facility);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tesis gÃ¼ncellenemedi.' });
    }
});
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// KULLANICI YÃ–NETÄ°MÄ° â€” Sadece Admin
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/users', auth_1.adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                roles: { include: { role: true } },
                facilities: { include: { facility: true } },
            },
            orderBy: { fullName: 'asc' },
        });
        res.json(users);
    }
    catch {
        res.status(500).json({ error: 'KullanÄ±cÄ±lar getirilemedi.' });
    }
});
router.post('/users', auth_1.adminMiddleware, async (req, res) => {
    const { username, fullName, email, phone, department, title, roles, facilities } = req.body;
    // Zorunlu alan kontrolÃ¼
    if (!username || !fullName || !email || !phone || !department || !title || !roles?.length) {
        return res.status(400).json({
            error: 'KullanÄ±cÄ± adÄ±, ad soyad, e-posta, telefon, departman, Ã¼nvan ve en az bir rol zorunludur.'
        });
    }
    try {
        // Rollerin var olduÄŸundan emin ol
        await ensureRolesExist();
        // Rol isimlerini ID'lere Ã§evir
        const roleRecords = await prisma.role.findMany({
            where: { name: { in: roles } },
        });
        if (roleRecords.length !== roles.length) {
            return res.status(400).json({ error: 'GeÃ§ersiz rol adÄ±.' });
        }
        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase().trim(),
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                department: department.trim(),
                title: title.trim(),
                roles: {
                    create: roleRecords.map((r) => ({ roleId: r.id })),
                },
                facilities: {
                    create: facilities?.map((facilityId) => ({ facilityId })) ?? [],
                },
            },
            include: {
                roles: { include: { role: true } },
                facilities: { include: { facility: true } },
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Bu kullanÄ±cÄ± adÄ± zaten kullanÄ±lÄ±yor.' });
        }
        console.error(error);
        res.status(500).json({ error: 'KullanÄ±cÄ± oluÅŸturulamadÄ±.' });
    }
});
router.put('/users/:username', auth_1.adminMiddleware, async (req, res) => {
    const usernameParam = String(req.params.username);
    const { fullName, email, phone, department, title, isActive, roles, facilities } = req.body;
    try {
        const updateData = {};
        if (fullName !== undefined)
            updateData.fullName = fullName.trim();
        if (email !== undefined)
            updateData.email = email.toLowerCase().trim();
        if (phone !== undefined)
            updateData.phone = phone.trim();
        if (department !== undefined)
            updateData.department = department.trim();
        if (title !== undefined)
            updateData.title = title.trim();
        if (isActive !== undefined)
            updateData.isActive = isActive;
        // Rolleri sadece gelirse gÃ¼ncelle
        if (roles !== undefined) {
            await prisma.userRole.deleteMany({ where: { username: usernameParam } });
            await ensureRolesExist();
            const roleRecords = await prisma.role.findMany({
                where: { name: { in: roles } },
            });
            updateData.roles = {
                create: roleRecords.map((r) => ({ roleId: r.id })),
            };
        }
        // Tesisleri sadece gelirse gÃ¼ncelle
        if (facilities !== undefined) {
            await prisma.userFacility.deleteMany({ where: { username: usernameParam } });
            updateData.facilities = {
                create: facilities?.map((facilityId) => ({ facilityId })) ?? [],
            };
        }
        const user = await prisma.user.update({
            where: { username: usernameParam },
            data: updateData,
            include: {
                roles: { include: { role: true } },
                facilities: { include: { facility: true } },
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'KullanÄ±cÄ± gÃ¼ncellenemedi.' });
    }
});
// KullanÄ±cÄ± tesis eriÅŸimi ekle/kaldÄ±r (mevcut kullanÄ±cÄ±ya tesis ekleme)
router.post('/users/:username/facilities', auth_1.adminMiddleware, async (req, res) => {
    const username = String(req.params.username);
    const { facilityId, action } = req.body; // action: 'add' | 'remove'
    if (!facilityId) {
        return res.status(400).json({ error: 'Tesis ID zorunludur.' });
    }
    try {
        if (action === 'add') {
            await prisma.userFacility.upsert({
                where: {
                    username_facilityId: { username, facilityId },
                },
                update: {},
                create: { username, facilityId },
            });
        }
        else if (action === 'remove') {
            await prisma.userFacility.delete({
                where: { username_facilityId: { username, facilityId } },
            });
        }
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                roles: { include: { role: true } },
                facilities: { include: { facility: true } },
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tesis eriÅŸimi gÃ¼ncellenemedi.' });
    }
});
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SÄ°STEM PARAMETRELERÄ° â€” Admin + Management
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/parameters', async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const settings = await prisma.systemSettings.findFirst({
            where: { year },
            orderBy: { year: 'desc' },
        });
        res.json(settings);
    }
    catch {
        res.status(500).json({ error: 'Parametreler getirilemedi.' });
    }
});
router.post('/parameters', auth_1.managementMiddleware, async (req, res) => {
    const { seriousAccidentDays, includeSaturday, dailyWorkHours, monthlyWorkDays, year } = req.body;
    const targetYear = year || new Date().getFullYear();
    try {
        const settings = await prisma.systemSettings.upsert({
            where: { year: targetYear },
            update: { seriousAccidentDays, includeSaturday, dailyWorkHours, monthlyWorkDays },
            create: {
                year: targetYear,
                seriousAccidentDays: seriousAccidentDays ?? 4,
                includeSaturday: includeSaturday ?? true,
                dailyWorkHours: dailyWorkHours ?? 7.5,
                monthlyWorkDays: monthlyWorkDays ?? {},
            },
        });
        res.json(settings);
    }
    catch {
        res.status(500).json({ error: 'Parametreler gÃ¼ncellenemedi.' });
    }
});
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// KATEGORÄ°LER & ALT KATEGORÄ°LER & DEPARTMANLAR â€” Admin + Management
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/definitions/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { subCategories: true },
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    }
    catch {
        res.status(500).json({ error: 'Kategoriler getirilemedi.' });
    }
});
router.post('/definitions/categories', auth_1.managementMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Kategori adÄ± zorunludur.' });
    try {
        const category = await prisma.category.create({ data: { name } });
        res.status(201).json(category);
    }
    catch {
        res.status(500).json({ error: 'Kategori oluÅŸturulamadÄ±.' });
    }
});
router.patch('/definitions/categories/:id', auth_1.managementMiddleware, async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { name } = req.body;
    try {
        const category = await prisma.category.update({ where: { id }, data: { name } });
        res.json(category);
    }
    catch {
        res.status(500).json({ error: 'Kategori gÃ¼ncellenemedi.' });
    }
});
router.post('/definitions/subcategories', auth_1.managementMiddleware, async (req, res) => {
    const { name, categoryId } = req.body;
    if (!name || !categoryId)
        return res.status(400).json({ error: 'Alt kategori adÄ± ve kategori ID zorunludur.' });
    try {
        const sub = await prisma.subCategory.create({ data: { name, categoryId } });
        res.status(201).json(sub);
    }
    catch {
        res.status(500).json({ error: 'Alt kategori oluÅŸturulamadÄ±.' });
    }
});
router.patch('/definitions/subcategories/:id', auth_1.managementMiddleware, async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { name } = req.body;
    try {
        const sub = await prisma.subCategory.update({ where: { id }, data: { name } });
        res.json(sub);
    }
    catch {
        res.status(500).json({ error: 'Alt kategori gÃ¼ncellenemedi.' });
    }
});
router.get('/definitions/departments', async (req, res) => {
    try {
        const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
        res.json(departments);
    }
    catch {
        res.status(500).json({ error: 'Departmanlar getirilemedi.' });
    }
});
router.post('/definitions/departments', auth_1.managementMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Departman adÄ± zorunludur.' });
    try {
        const dept = await prisma.department.create({ data: { name } });
        res.status(201).json(dept);
    }
    catch {
        res.status(500).json({ error: 'Departman oluÅŸturulamadÄ±.' });
    }
});
router.patch('/definitions/departments/:id', auth_1.managementMiddleware, async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { name } = req.body;
    try {
        const dept = await prisma.department.update({ where: { id }, data: { name } });
        res.json(dept);
    }
    catch {
        res.status(500).json({ error: 'Departman gÃ¼ncellenemedi.' });
    }
});
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ROL LÄ°STESÄ° â€” KullanÄ±cÄ± yÃ¶netimi formu iÃ§in
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ârouter.post('/smtp/test', adminMiddleware, async (req: AuthRequest, res: Response) => {
const { to } = req.body;
if (!to)
    return res.status(400).json({ error: 'AlÄ±cÄ± e-posta adresi zorunludur.' });
try {
    const { sendMail } = require('../services/mail');
    await sendMail(to, 'SEC PortalÄ± - SMTP Test MesajÄ±', `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0f172a;">SMTP BaÄŸlantÄ± Testi</h2>
        <p>Merhaba,</p>
        <p>Bu e-posta, SEC PortalÄ± SMTP ayarlarÄ±nÄ±n doÄŸrulanmasÄ± amacÄ±yla gÃ¶nderilmiÅŸtir.</p>
        <p style="color: #10b981; font-weight: bold;">Tebrikler! SMTP ayarlarÄ±nÄ±z baÅŸarÄ±yla yapÄ±landÄ±rÄ±ldÄ±.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <small style="color: #64748b;">Bu otomatik bir mesajdÄ±r, lÃ¼tfen yanÄ±tlamayÄ±nÄ±z.</small>
      </div>
      `);
    res.json({ message: 'Test e-postasÄ± baÅŸarÄ±yla gÃ¶nderildi.' });
}
catch (error) {
    console.error(error);
    res.status(500).json({ error: `Test e-postasÄ± gÃ¶nderilemedi: ${error.message}` });
}
;
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BÄ°LDÄ°RÄ°M AYARLARI â€” Sadece Admin
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/notification-settings', auth_1.adminMiddleware, async (req, res) => {
    try {
        const settings = await prisma.notificationSettings.findFirst({ where: { id: 1 } });
        res.json(settings || {
            id: 1,
            enableEmailAlerts: true,
            enableAppAlerts: true,
            notifyOnAccident: true,
            notifyOnAssignment: true,
            notifyOnReconciliation: true,
            notifyOnSystemAlert: true
        });
    }
    catch {
        res.status(500).json({ error: 'Bildirim ayarlarÄ± getirilemedi.' });
    }
});
router.post('/notification-settings', auth_1.adminMiddleware, async (req, res) => {
    const { enableEmailAlerts, enableAppAlerts, notifyOnAccident, notifyOnAssignment, notifyOnReconciliation, notifyOnSystemAlert } = req.body;
    try {
        const settings = await prisma.notificationSettings.upsert({
            where: { id: 1 },
            update: {
                enableEmailAlerts, enableAppAlerts, notifyOnAccident,
                notifyOnAssignment, notifyOnReconciliation, notifyOnSystemAlert
            },
            create: {
                id: 1,
                enableEmailAlerts: enableEmailAlerts ?? true,
                enableAppAlerts: enableAppAlerts ?? true,
                notifyOnAccident: notifyOnAccident ?? true,
                notifyOnAssignment: notifyOnAssignment ?? true,
                notifyOnReconciliation: notifyOnReconciliation ?? true,
                notifyOnSystemAlert: notifyOnSystemAlert ?? true
            },
        });
        res.json(settings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bildirim ayarlarÄ± kaydedilemedi.' });
    }
});
exports.default = router;
ss, secure, fromEmail, fromName;
req.body;
if (!host || !port || !user || !pass || !fromEmail) {
    return res.status(400).json({ error: 'TÃ¼m alanlar zorunludur.' });
}
try {
    const settings = await prisma.smtpSettings.upsert({
        where: { id: 1 },
        update: { host, port: parseInt(String(port)), user, pass, secure, fromEmail, fromName },
        create: { id: 1, host, port: parseInt(String(port)), user, pass, secure, fromEmail, fromName },
    });
    res.json(settings);
}
catch (error) {
    console.error(error);
    res.status(500).json({ error: 'SMTP ayarlarÄ± kaydedilemedi.' });
}
;
router.post('/smtp/test', auth_1.adminMiddleware, async (req, res) => {
    const { to } = req.body;
    if (!to)
        return res.status(400).json({ error: 'AlÄ±cÄ± e-posta adresi zorunludur.' });
    try {
        const { sendMail } = require('../services/mail');
        await sendMail(to, 'SEC PortalÄ± - SMTP Test MesajÄ±', `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0f172a;">SMTP BaÄŸlantÄ± Testi</h2>
        <p>Merhaba,</p>
        <p>Bu e-posta, SEC PortalÄ± SMTP ayarlarÄ±nÄ±n doÄŸrulanmasÄ± amacÄ±yla gÃ¶nderilmiÅŸtir.</p>
        <p style="color: #10b981; font-weight: bold;">Tebrikler! SMTP ayarlarÄ±nÄ±z baÅŸarÄ±yla yapÄ±landÄ±rÄ±ldÄ±.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <small style="color: #64748b;">Bu otomatik bir mesajdÄ±r, lÃ¼tfen yanÄ±tlamayÄ±nÄ±z.</small>
      </div>
      `);
        res.json({ message: 'Test e-postasÄ± baÅŸarÄ±yla gÃ¶nderildi.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: `Test e-postasÄ± gÃ¶nderilemedi: ${error.message}` });
    }
});
exports.default = router;
