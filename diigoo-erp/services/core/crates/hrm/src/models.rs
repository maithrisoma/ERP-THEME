//! HRM row models + JSON projection matching the TypeScript contract.
use chrono::NaiveDate;
use serde_json::{json, Value};

#[derive(Debug, sqlx::FromRow)]
pub struct EmployeeRow {
    pub id: String,
    pub employee_no: String,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub avatar_tone: String,
    pub status: String,
    pub employment_type: String,
    pub position_id: String,
    pub department_id: String,
    pub location_id: String,
    pub manager_id: Option<String>,
    pub hire_date: NaiveDate,
    pub termination_date: Option<NaiveDate>,
    pub base_amount_cents: i64,
    pub currency: String,
    pub pay_type: String,
    pub pay_cycle: String,
    pub flsa_exempt: bool,
}

impl EmployeeRow {
    /// Project to the same JSON shape the frontend expects (nested compensation).
    pub fn to_json(&self) -> Value {
        json!({
            "id": self.id,
            "employeeNo": self.employee_no,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "avatarTone": self.avatar_tone,
            "status": self.status,
            "employmentType": self.employment_type,
            "positionId": self.position_id,
            "departmentId": self.department_id,
            "locationId": self.location_id,
            "managerId": self.manager_id,
            "hireDate": self.hire_date,
            "terminationDate": self.termination_date,
            "compensation": {
                "payType": self.pay_type,
                "base": { "amount": self.base_amount_cents, "currency": self.currency },
                "payCycle": self.pay_cycle,
                "flsaExempt": self.flsa_exempt,
            },
            "customFields": {},
            "tags": [],
        })
    }
}
