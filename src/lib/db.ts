
'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { Empresa, Permission } from './types';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from './permissions';
import { calculateAge } from './utils';

let db: Database | null = null;


async function runMigrations(dbInstance: Database) {
    console.log('Checking database schema...');
    await dbInstance.exec('PRAGMA foreign_keys=OFF;');

    const personasCols = await dbInstance.all("PRAGMA table_info('personas')").catch(() => []);
    if (personasCols.length > 0 && !personasCols.some(c => c.name === 'createdAt')) {
        await dbInstance.exec('ALTER TABLE personas ADD COLUMN createdAt TEXT');
        console.log("Added createdAt column to personas table.");
    }
    
    const rolesCols = await dbInstance.all("PRAGMA table_info('roles')").catch(() => []);
    if (rolesCols.length > 0 && !rolesCols.some(col => col.name === 'hasSpecialty')) {
        await dbInstance.exec('ALTER TABLE roles ADD COLUMN hasSpecialty BOOLEAN NOT NULL DEFAULT 0');
         console.log("Added hasSpecialty column to roles table.");
    }
    
    const consultationsCols = await dbInstance.all("PRAGMA table_info('consultations')").catch(() => []);
    if (consultationsCols.length > 0) {
        if (!consultationsCols.some(c => c.name === 'surveyInvitationToken')) {
            await dbInstance.exec('ALTER TABLE consultations ADD COLUMN surveyInvitationToken TEXT');
            console.log("Added surveyInvitationToken column to consultations table.");
        }
        if (!consultationsCols.some(c => c.name === 'radiologyOrders')) {
            await dbInstance.exec('ALTER TABLE consultations ADD COLUMN radiologyOrders TEXT');
            console.log("Added radiologyOrders column to consultations table.");
        }
        if (!consultationsCols.some(c => c.name === 'reposo')) {
            await dbInstance.exec('ALTER TABLE consultations ADD COLUMN reposo TEXT');
            console.log("Added reposo column to consultations table.");
        }
    }
    
    const titularesCols = await dbInstance.all("PRAGMA table_info('titulares')").catch(() => []);
    if (titularesCols.length > 0 && !titularesCols.some(c => c.name === 'numeroFicha')) {
        await dbInstance.exec('ALTER TABLE titulares ADD COLUMN numeroFicha TEXT');
        console.log("Added numeroFicha column to titulares table.");
    }
    
    await dbInstance.exec('PRAGMA foreign_keys=ON;');
    console.log('Database schema check complete.');
}


async function initializeDb(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    
    const dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    await dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    await createTables(dbInstance);
    await runMigrations(dbInstance);
    
    await seedDb(dbInstance);

    return dbInstance;
}


async function createTables(dbInstance: Database): Promise<void> {
     await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            hasSpecialty BOOLEAN NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS role_permissions (
            roleId TEXT NOT NULL,
            permissionId TEXT NOT NULL,
            PRIMARY KEY (roleId, permissionId),
            FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            roleId TEXT NOT NULL,
            specialty TEXT,
            personaId TEXT,
            FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE RESTRICT,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rif TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            primerNombre TEXT NOT NULL,
            segundoNombre TEXT,
            primerApellido TEXT NOT NULL,
            segundoApellido TEXT,
            nacionalidad TEXT,
            cedulaNumero TEXT,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono1 TEXT,
            telefono2 TEXT,
            email TEXT,
            direccion TEXT,
            representanteId TEXT,
            createdAt TEXT,
            UNIQUE(nacionalidad, cedulaNumero),
            FOREIGN KEY (representanteId) REFERENCES personas(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS pacientes (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL UNIQUE,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS titulares (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL UNIQUE,
            unidadServicio TEXT NOT NULL,
            numeroFicha TEXT,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS beneficiarios (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL,
            titularId TEXT NOT NULL,
            UNIQUE(personaId, titularId),
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY (titularId) REFERENCES titulares(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS waitlist (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL,
            pacienteId TEXT NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            serviceType TEXT NOT NULL,
            accountType TEXT NOT NULL,
            status TEXT NOT NULL,
            checkInTime TEXT NOT NULL,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS consultations (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            waitlistId TEXT,
            consultationDate TEXT NOT NULL,
            motivoConsulta TEXT,
            enfermedadActual TEXT,
            revisionPorSistemas TEXT,
            antecedentesPersonales TEXT,
            antecedentesFamiliares TEXT,
            antecedentesGinecoObstetricos TEXT,
            antecedentesPediatricos TEXT,
            signosVitales TEXT,
            examenFisicoGeneral TEXT,
            treatmentPlan TEXT,
            radiologyOrders TEXT,
            surveyInvitationToken TEXT,
            reposo TEXT,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS consultation_diagnoses (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL,
            cie10Code TEXT NOT NULL,
            cie10Description TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS consultation_documents (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileType TEXT NOT NULL,
            documentType TEXT NOT NULL,
            description TEXT,
            fileData TEXT NOT NULL,
            uploadedAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS cie10_codes (
            code TEXT PRIMARY KEY,
            description TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS treatment_orders (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationId TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente', 
            createdAt TEXT NOT NULL,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS treatment_order_items (
            id TEXT PRIMARY KEY,
            treatmentOrderId TEXT NOT NULL,
            medicamentoProcedimiento TEXT NOT NULL,
            dosis TEXT,
            via TEXT,
            frecuencia TEXT,
            duracion TEXT,
            instrucciones TEXT,
            status TEXT NOT NULL DEFAULT 'Pendiente', 
            FOREIGN KEY (treatmentOrderId) REFERENCES treatment_orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS treatment_executions (
            id TEXT PRIMARY KEY,
            treatmentOrderItemId TEXT NOT NULL,
            executionTime TEXT NOT NULL,
            observations TEXT NOT NULL,
            executedBy TEXT NOT NULL,
            FOREIGN KEY (treatmentOrderItemId) REFERENCES treatment_order_items(id) ON DELETE CASCADE
        );


        CREATE TABLE IF NOT EXISTS lab_orders (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationId TEXT NOT NULL,
            orderDate TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente',
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS lab_order_items (
            id TEXT PRIMARY KEY,
            labOrderId TEXT NOT NULL,
            testName TEXT NOT NULL,
            FOREIGN KEY (labOrderId) REFERENCES lab_orders(id) ON DELETE CASCADE
        );

        -- Survey Tables
        CREATE TABLE IF NOT EXISTS surveys (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            isActive BOOLEAN NOT NULL DEFAULT 1,
            createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS survey_questions (
            id TEXT PRIMARY KEY,
            surveyId TEXT NOT NULL,
            questionText TEXT NOT NULL,
            questionType TEXT NOT NULL, -- 'escala_1_5', 'si_no', 'texto_abierto'
            displayOrder INTEGER NOT NULL,
            FOREIGN KEY (surveyId) REFERENCES surveys(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS survey_invitations (
            token TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL UNIQUE,
            surveyId TEXT NOT NULL,
            isCompleted BOOLEAN NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE,
            FOREIGN KEY (surveyId) REFERENCES surveys(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS survey_responses (
            id TEXT PRIMARY KEY,
            invitationToken TEXT NOT NULL,
            questionId TEXT NOT NULL,
            answerValue TEXT,
            submittedAt TEXT NOT NULL,
            FOREIGN KEY (invitationToken) REFERENCES survey_invitations(token) ON DELETE CASCADE,
            FOREIGN KEY (questionId) REFERENCES survey_questions(id) ON DELETE CASCADE
        );
        
        -- Billing Tables
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL UNIQUE,
            totalAmount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, Pagada, Anulada
            createdAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            invoiceId TEXT NOT NULL,
            serviceId TEXT NOT NULL,
            serviceName TEXT NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE RESTRICT
        );
    `);
}


async function seedDb(dbInstance: Database): Promise<void> {
    const roleCount = await dbInstance.get('SELECT COUNT(*) as count FROM roles');
    if (roleCount.count === 0) {
        const roles = [
            { id: 'superuser', name: 'Superusuario', description: 'Acceso total a todas las funciones del sistema.', hasSpecialty: 1 },
            { id: 'administrator', name: 'Administrador', description: 'Gestiona la parametrización del sistema como empresas y catálogos.', hasSpecialty: 0 },
            { id: 'asistencial', name: 'Asistencial', description: 'Personal de recepción encargado de la admisión de pacientes.', hasSpecialty: 0 },
            { id: 'doctor', name: 'Doctor', description: 'Personal médico que realiza consultas.', hasSpecialty: 1 },
            { id: 'enfermera', name: 'Enfermera', description: 'Personal de enfermería que aplica tratamientos.', hasSpecialty: 0 },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO roles (id, name, description, hasSpecialty) VALUES (?, ?, ?, ?)');
        for (const role of roles) {
            await stmt.run(role.id, role.name, role.description, role.hasSpecialty);
        }
        await stmt.finalize();

        const rolePermissions = {
            administrator: ['companies.manage', 'cie10.manage', 'reports.view', 'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage', 'surveys.manage', 'services.manage'],
            asistencial: ['people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage', 'companies.manage'],
            doctor: ['consultation.perform', 'hce.view', 'treatmentlog.manage', 'reports.view', 'waitlist.manage'],
            enfermera: ['treatmentlog.manage', 'waitlist.manage'],
        };

        const permStmt = await dbInstance.prepare('INSERT INTO role_permissions (roleId, permissionId) VALUES (?, ?)');
        // Grant all permissions to superuser
        for (const p of ALL_PERMISSIONS) {
            await permStmt.run('superuser', p.id);
        }
        
        for (const [roleId, permissions] of Object.entries(rolePermissions)) {
            for (const permissionId of permissions) {
                await permStmt.run(roleId, permissionId);
            }
        }
        await permStmt.finalize();
    }

    const empresaCountResult = await dbInstance.get('SELECT COUNT(*) as count FROM empresas');
    if (empresaCountResult.count === 0) {
        const empresas: Empresa[] = [
            { id: "emp1", name: "Innovatech Solutions", rif: "J-12345678-9", telefono: "0212-555-1111", direccion: "Av. Principal, Caracas" },
            { id: "emp2", name: "Nexus Group", rif: "J-23456789-0", telefono: "0212-555-2222", direccion: "Calle Secundaria, Valencia" },
            { id: "emp3", name: "Quantum Industries", rif: "J-34567890-1", telefono: "0212-555-3333", direccion: "Torre Empresarial, Maracaibo" },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)');
        for (const empresa of empresas) {
            await stmt.run(empresa.id, empresa.name, empresa.rif, empresa.telefono, empresa.direccion);
        }
        await stmt.finalize();
    }
    
    const personaCountResult = await dbInstance.get('SELECT COUNT(*) as count FROM personas');
    if (personaCountResult.count === 0) {
        const personas = [
             { id: "p1", p_nombre: "Carlos", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "12345678", fecha: "1985-02-20T05:00:00.000Z", gen: "Masculino", tel1: "0212-555-1234", tel2: "0414-1234567", email: "carlos.r@email.com", dir: "Av. Urdaneta" },
             { id: "p2", p_nombre: "Ana", s_nombre: null, p_apellido: "Martinez", s_apellido: null, nac: 'V', ced: "87654321", fecha: "1990-08-10T04:00:00.000Z", gen: "Femenino", tel1: "0241-555-5678", tel2: "0412-7654321", email: "ana.m@email.com", dir: null },
             { id: "p3", p_nombre: "Luis", s_nombre: null, p_apellido: "Hernandez", s_apellido: null, nac: 'E', ced: "98765432", fecha: "1978-12-05T05:00:00.000Z", gen: "Masculino", tel1: "0261-555-9012", tel2: "0424-9876543", email: "luis.h@email.com", dir: null },
             { id: "p4", p_nombre: "Sofia", s_nombre: null, p_apellido: "Gomez", s_apellido: null, nac: 'V', ced: "23456789", fecha: "1995-04-30T04:00:00.000Z", gen: "Femenino", tel1: "0212-555-3456", tel2: "0416-2345678", email: "sofia.g@email.com", dir: null },
             { id: "p5", p_nombre: "Laura", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "29876543", fecha: "2010-06-15T04:00:00.000Z", gen: "Femenino", email: "laura.r@email.com", dir: null },
             { id: "p6", p_nombre: "David", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "29876544", fecha: "2012-09-20T04:00:00.000Z", gen: "Masculino", email: "david.r@email.com", dir: null },
        ];
        const personaStmt = await dbInstance.prepare('INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)');
        for (const p of personas) {
            await personaStmt.run(p.id, p.p_nombre, p.s_nombre, p.p_apellido, p.s_apellido, p.nac, p.ced, p.fecha, p.gen, p.tel1, p.tel2, p.email, p.dir, new Date(p.fecha).toISOString());
        }
        await personaStmt.finalize();

        const titulares = [
            { id: "t1", personaId: "p1", unidadServicio: "Empleado", numeroFicha: "1234" },
            { id: "t2", personaId: "p2", unidadServicio: "Privado", numeroFicha: null },
            { id: "t3", personaId: "p3", unidadServicio: "Afiliado Corporativo", numeroFicha: null },
            { id: "t4", personaId: "p4", unidadServicio: "Empleado", numeroFicha: "4321" },
        ];
        const titularStmt = await dbInstance.prepare('INSERT INTO titulares (id, personaId, unidadServicio, numeroFicha) VALUES (?, ?, ?, ?)');
        for (const t of titulares) {
            await titularStmt.run(t.id, t.personaId, t.unidadServicio, t.numeroFicha);
        }
        await titularStmt.finalize();
        
        const beneficiarios = [
            { id: "b1", personaId: "p5", titularId: "t1" },
            { id: "b2", personaId: "p6", titularId: "t1" },
        ];
        const beneficiarioStmt = await dbInstance.prepare('INSERT INTO beneficiarios (id, personaId, titularId) VALUES (?, ?, ?)');
        for (const b of beneficiarios) {
            await beneficiarioStmt.run(b.id, b.personaId, b.titularId);
        }
        await beneficiarioStmt.finalize();

        const pacienteStmt = await dbInstance.prepare('INSERT INTO pacientes (id, personaId) VALUES (?, ?)');
        for (const p of personas) {
            await pacienteStmt.run(`pac-${p.id}`, p.id);
        }
        await pacienteStmt.finalize();
    }
    
    const userCount = await dbInstance.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        const users = [
            { id: 'usr-super', username: 'superuser', password: 'password123', roleId: 'superuser', specialty: null, personaId: null, name: 'Super Usuario' },
            { id: 'usr-admin', username: 'admin', password: 'password123', roleId: 'administrator', specialty: null, personaId: null, name: 'Administrador' },
            { id: 'usr-assist', username: 'asistente', password: 'password123', roleId: 'asistencial', specialty: null, personaId: 'p4', name: 'Sofia Gomez' },
            { id: 'usr-doctor', username: 'pediatra', password: 'password123', roleId: 'doctor', specialty: 'medico pediatra', personaId: 'p2', name: 'Ana Martinez' },
            { id: 'usr-nurse', username: 'enfermera', password: 'password123', roleId: 'enfermera', specialty: null, personaId: null, name: 'Enfermera Jefa' },
        ];

        const userStmt = await dbInstance.prepare('INSERT INTO users (id, username, password, roleId, specialty, personaId) VALUES (?, ?, ?, ?, ?, ?)');
        for (const u of users) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await userStmt.run(u.id, u.username, hashedPassword, u.roleId, u.specialty, u.personaId);
        }
        await userStmt.finalize();
    }

    const cie10CountResult = await dbInstance.get('SELECT COUNT(*) as count FROM cie10_codes');
    if (cie10CountResult.count === 0) {
        const codes = [
            { code: 'J00', description: 'Nasofaringitis aguda (resfriado común)' },
            { code: 'J02.9', description: 'Faringitis aguda, no especificada' },
            { code: 'J03.9', description: 'Amigdalitis aguda, no especificada' },
            { code: 'A09X', description: 'Enfermedad diarreica y gastroenteritis de presunto origen infeccioso' },
            { code: 'R51', description: 'Cefalea' },
            { code: 'M54.5', description: 'Lumbago no especificado' },
            { code: 'L23.9', description: 'Dermatitis alérgica de contacto, de causa no especificada' },
            { code: 'H10.9', description: 'Conjuntivitis, no especificada' },
            { code: 'I10', description: 'Hipertensión esencial (primaria)' },
            { code: 'E11.9', description: 'Diabetes mellitus tipo 2, sin complicaciones' },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO cie10_codes (code, description) VALUES (?, ?)');
        for (const c of codes) {
            await stmt.run(c.code, c.description);
        }
        await stmt.finalize();
    }
    
    const surveyCount = await dbInstance.get('SELECT COUNT(*) as count FROM surveys');
    if (surveyCount.count === 0) {
        const surveyId = `survey-${Date.now()}`;
        await dbInstance.run(
            'INSERT INTO surveys (id, title, description, createdAt) VALUES (?, ?, ?, ?)',
            surveyId,
            'Encuesta de Satisfacción Post-Consulta',
            'Ayúdenos a mejorar nuestro servicio respondiendo estas breves preguntas.',
            new Date().toISOString()
        );
        
        const questions = [
            { text: '¿Cómo calificaría la amabilidad y el trato recibido por el personal de recepción?', type: 'escala_1_5', order: 1 },
            { text: '¿El tiempo de espera para su consulta fue razonable?', type: 'si_no', order: 2 },
            { text: '¿Cómo calificaría la claridad de las explicaciones proporcionadas por el médico?', type: 'escala_1_5', order: 3 },
            { text: '¿Se siente satisfecho/a con la atención médica recibida en general?', type: 'si_no', order: 4 },
            { text: '¿Tiene algún comentario o sugerencia adicional para mejorar nuestro servicio?', type: 'texto_abierto', order: 5 },
        ];
        
        const stmt = await dbInstance.prepare('INSERT INTO survey_questions (id, surveyId, questionText, questionType, displayOrder) VALUES (?, ?, ?, ?, ?)');
        for (const q of questions) {
            await stmt.run(`q-${Date.now()}-${q.order}`, surveyId, q.text, q.type, q.order);
        }
        await stmt.finalize();
    }

    const serviceCount = await dbInstance.get('SELECT COUNT(*) as count FROM services');
    if (serviceCount.count === 0) {
        const services = [
            { id: 'serv-consulta-general', name: 'Consulta Medicina Familiar', description: 'Consulta médica para adultos.', price: 50.00 },
            { id: 'serv-consulta-ped', name: 'Consulta Pediátrica', description: 'Consulta médica para niños.', price: 60.00 },
            { id: 'serv-sutura-simple', name: 'Sutura Simple', description: 'Sutura de heridas menores (hasta 5 puntos).', price: 30.00 },
            { id: 'serv-sutura-compleja', name: 'Sutura Compleja', description: 'Sutura de heridas mayores (más de 5 puntos).', price: 75.00 },
            { id: 'serv-inyeccion-im', name: 'Inyección Intramuscular', description: 'Aplicación de medicamento vía intramuscular.', price: 10.00 },
            { id: 'serv-inyeccion-iv', name: 'Aplicación de Tratamiento Intravenoso', description: 'Administración de medicamento o suero vía intravenosa.', price: 25.00 },
            { id: 'serv-retiro-puntos', name: 'Retiro de Puntos', description: 'Retiro de suturas.', price: 15.00 },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO services (id, name, description, price) VALUES (?, ?, ?, ?)');
        for (const s of services) {
            await stmt.run(s.id, s.name, s.description, s.price);
        }
        await stmt.finalize();
    }
}


export async function getDb(): Promise<Database> {
    if (!db) {
        db = await initializeDb();
    }
    return db;
}

    