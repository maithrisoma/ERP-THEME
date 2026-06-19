-- ════════════════════════════════════════════════════════════════════════
-- Demo seed for the `core` data adapter. Set the tenant GUC first so the
-- FORCE'd RLS policies accept the inserts (WITH CHECK).
-- ════════════════════════════════════════════════════════════════════════
SELECT set_config('app.current_tenant', 't_diigoo_demo', false);

INSERT INTO tenants (id, name, tier, country, currency) VALUES
  ('t_diigoo_demo', 'Northwind Retail Group', 'enterprise', 'US', 'USD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hr_locations (id, tenant_id, name, code, region, city, country, timezone) VALUES
  ('st_001','t_diigoo_demo','Downtown Flagship','DTN','rg_east','New York','US','America/New_York'),
  ('st_002','t_diigoo_demo','Riverside Mall','RVS','rg_east','Boston','US','America/New_York'),
  ('st_003','t_diigoo_demo','Westgate Center','WGT','rg_west','Austin','US','America/Chicago');

INSERT INTO hr_departments (id, tenant_id, name, code, cost_center) VALUES
  ('dp_exec','t_diigoo_demo','Executive','EXE','CC-100'),
  ('dp_retail','t_diigoo_demo','Retail Operations','RET','CC-200'),
  ('dp_fin','t_diigoo_demo','Finance','FIN','CC-300'),
  ('dp_hr','t_diigoo_demo','People & Culture','HR','CC-400'),
  ('dp_tech','t_diigoo_demo','Technology','TEC','CC-500'),
  ('dp_mkt','t_diigoo_demo','Marketing','MKT','CC-600');

INSERT INTO hr_positions (id, tenant_id, title, department_id, level, band) VALUES
  ('po_ceo','t_diigoo_demo','Chief Executive Officer','dp_exec','exec','E1'),
  ('po_hrd','t_diigoo_demo','Director of People','dp_hr','director','D1'),
  ('po_hrbp','t_diigoo_demo','HR Business Partner','dp_hr','senior','S2'),
  ('po_sm','t_diigoo_demo','Store Manager','dp_retail','manager','M1'),
  ('po_cashier','t_diigoo_demo','Sales Associate','dp_retail','associate','A1'),
  ('po_acct','t_diigoo_demo','Senior Accountant','dp_fin','senior','S2'),
  ('po_dev','t_diigoo_demo','Software Engineer','dp_tech','senior','S1');

INSERT INTO hr_employees (id, tenant_id, employee_no, first_name, last_name, email, phone, avatar_tone, status, employment_type, position_id, department_id, location_id, manager_id, hire_date, base_amount_cents, currency, pay_type, pay_cycle, flsa_exempt) VALUES
  ('e_1000','t_diigoo_demo','EMP-1000','Eleanor','Vance','eleanor.vance@northwind.demo','+1 (212) 555-1000','navy','active','full_time','po_ceo','dp_exec','st_001',NULL,'2018-02-01',32000000,'USD','salary','biweekly',true),
  ('e_1001','t_diigoo_demo','EMP-1001','Marcus','Hale','marcus.hale@northwind.demo','+1 (212) 555-1001','teal','active','full_time','po_hrd','dp_hr','st_001','e_1000','2019-06-15',16800000,'USD','salary','biweekly',true),
  ('e_1042','t_diigoo_demo','EMP-1042','Priya','Nair','priya.nair@northwind.demo','+1 (212) 555-1042','blue','active','full_time','po_hrbp','dp_hr','st_001','e_1001','2021-09-01',9800000,'USD','salary','biweekly',true),
  ('e_1003','t_diigoo_demo','EMP-1003','James','Okafor','james.okafor@northwind.demo','+1 (212) 555-1003','purple','active','full_time','po_sm','dp_retail','st_001','e_1000','2020-04-12',8800000,'USD','salary','biweekly',true),
  ('e_1021','t_diigoo_demo','EMP-1021','Grace','Bennett','grace.bennett@northwind.demo','+1 (212) 555-1021','green','active','part_time','po_cashier','dp_retail','st_001','e_1003','2023-02-20',1900,'USD','hourly','biweekly',false),
  ('e_1022','t_diigoo_demo','EMP-1022','Leo','Martins','leo.martins@northwind.demo','+1 (212) 555-1022','amber','probation','full_time','po_cashier','dp_retail','st_001','e_1003','2026-04-01',1850,'USD','hourly','biweekly',false),
  ('e_1006','t_diigoo_demo','EMP-1006','Victor','Almeida','victor.almeida@northwind.demo','+1 (212) 555-1006','coral','active','full_time','po_acct','dp_fin','st_002','e_1000','2021-01-25',9200000,'USD','salary','biweekly',true),
  ('e_1009','t_diigoo_demo','EMP-1009','Chloe','Dubois','chloe.dubois@northwind.demo','+1 (212) 555-1009','navy','active','full_time','po_dev','dp_tech','st_003','e_1000','2022-06-06',12400000,'USD','salary','biweekly',true),
  ('e_2001','t_diigoo_demo','EMP-2001','Omar','Farouk','omar.farouk@northwind.demo','+1 (212) 555-2001','amber','on_leave','seasonal','po_cashier','dp_retail','st_001','e_1003','2024-05-30',1800,'USD','hourly','biweekly',false),
  ('e_2002','t_diigoo_demo','EMP-2002','Felix','Andersson','felix.andersson@northwind.demo','+1 (212) 555-2002','gray','terminated','full_time','po_cashier','dp_retail','st_002','e_1003','2020-09-01',2000,'USD','hourly','biweekly',false),
  ('e_2003','t_diigoo_demo','EMP-2003','Mason','Cole','mason.cole@northwind.demo','+1 (212) 555-2003','teal','suspended','full_time','po_cashier','dp_retail','st_001','e_1003','2022-03-01',2200,'USD','hourly','biweekly',false),
  ('e_2004','t_diigoo_demo','EMP-2004','Nadia','Petrova','nadia.petrova@northwind.demo','+1 (212) 555-2004','blue','active','contract','po_acct','dp_fin','st_001','e_1006','2023-10-02',5500,'USD','hourly','biweekly',false),
  ('e_2005','t_diigoo_demo','EMP-2005','Dev','Krishnan','dev.krishnan@northwind.demo','+1 (212) 555-2005','purple','active','intern','po_dev','dp_tech','st_001','e_1009','2025-06-01',2500,'USD','hourly','biweekly',false),
  ('e_2006','t_diigoo_demo','EMP-2006','Amara','Diallo','amara.diallo@northwind.demo','+1 (212) 555-2006','green','active','contract','po_mkt','dp_mkt','st_002','e_1000','2024-02-12',2800,'USD','hourly','biweekly',false),
  ('e_2007','t_diigoo_demo','EMP-2007','Bianca','Conti','bianca.conti@northwind.demo','+1 (212) 555-2007','amber','active','full_time','po_mkt','dp_mkt','st_001','e_1000','2021-05-04',11200000,'USD','salary','biweekly',true),
  ('e_2008','t_diigoo_demo','EMP-2008','Noah','Berg','noah.berg@northwind.demo','+1 (212) 555-2008','coral','active','part_time','po_cashier','dp_retail','st_002','e_1003','2023-01-09',2100,'USD','hourly','biweekly',false),
  ('e_2009','t_diigoo_demo','EMP-2009','Grace','Wright','grace.wright@northwind.demo','+1 (212) 555-2009','navy','probation','full_time','po_acct','dp_fin','st_001','e_1006','2026-05-01',7800000,'USD','salary','biweekly',true),
  ('e_2010','t_diigoo_demo','EMP-2010','Leo','Martins','leo.martins2@northwind.demo','+1 (212) 555-2010','teal','active','intern','po_mkt','dp_mkt','st_001','e_1000','2025-09-01',2400,'USD','hourly','biweekly',false);

INSERT INTO hr_leave_requests (id, tenant_id, employee_id, policy_id, policy_name, start_date, end_date, days, reason, status) VALUES
  ('lr_001','t_diigoo_demo','e_1021','lp_pto','Paid Time Off','2026-06-22','2026-06-26',5,'Family vacation','pending'),
  ('lr_002','t_diigoo_demo','e_1009','lp_sick','Sick Leave','2026-06-13','2026-06-13',1,'Medical appointment','pending'),
  ('lr_003','t_diigoo_demo','e_1003','lp_pto','Paid Time Off','2026-07-01','2026-07-03',3,'Personal','approved');

INSERT INTO hr_requisitions (id, tenant_id, title, department_id, location_id, employment_type, openings, status, hiring_manager_id, posted_at, applicant_count) VALUES
  ('jr_001','t_diigoo_demo','Store Manager — Westgate','dp_retail','st_003','full_time',1,'open','e_1000','2026-05-20',28),
  ('jr_002','t_diigoo_demo','Software Engineer (Backend)','dp_tech','st_001','full_time',2,'open','e_1000','2026-05-28',64);
