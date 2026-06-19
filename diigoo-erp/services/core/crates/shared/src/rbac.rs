//! RBAC engine (Rust mirror of the TypeScript `platform/rbac.ts`).
//!
//! Same 15-level role hierarchy and module matrix. `can()` is called by every
//! module handler before touching data — defence in depth alongside Postgres RLS.
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    SuperAdmin, Owner, RegionalManager, StoreManager, AssistantManager, Cashier,
    InventoryStaff, DeliveryManager, DeliveryDriver, Accountant, HrManager,
    MarketingStaff, ItAdmin, Auditor, FranchisePartner, Employee,
}

impl Role {
    pub fn parse(s: &str) -> Option<Role> {
        use Role::*;
        Some(match s {
            "super_admin" => SuperAdmin, "owner" => Owner, "regional_manager" => RegionalManager,
            "store_manager" => StoreManager, "assistant_manager" => AssistantManager, "cashier" => Cashier,
            "inventory_staff" => InventoryStaff, "delivery_manager" => DeliveryManager,
            "delivery_driver" => DeliveryDriver, "accountant" => Accountant, "hr_manager" => HrManager,
            "marketing_staff" => MarketingStaff, "it_admin" => ItAdmin, "auditor" => Auditor,
            "franchise_partner" => FranchisePartner, "employee" => Employee,
            _ => return None,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Module { Hr, SalesCrm, Finance, AiAnalytics, SystemAdmin, Integrations, Other }

impl Module {
    pub fn parse(s: &str) -> Module {
        match s {
            "hr" => Module::Hr, "sales_crm" => Module::SalesCrm, "finance" => Module::Finance,
            "ai_analytics" => Module::AiAnalytics, "system_admin" => Module::SystemAdmin,
            "integrations" => Module::Integrations, _ => Module::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action { Create, Read, Update, Delete, Approve, Operate, Export }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Access { Full, Edit, Create, View, Operate, None }

impl Access {
    fn allows(self, a: Action) -> bool {
        use Action as Ac;
        match self {
            Access::Full => true,
            Access::Edit => matches!(a, Ac::Create | Ac::Read | Ac::Update | Ac::Export),
            Access::Create => matches!(a, Ac::Create | Ac::Read),
            Access::View => matches!(a, Ac::Read),
            Access::Operate => matches!(a, Ac::Read | Ac::Operate),
            Access::None => false,
        }
    }
}

/// Coarse module access for a role. Encodes the HR-relevant columns of the
/// document matrix; unknown combinations default to None (deny by default).
pub fn module_access(role: Role, module: Module) -> Access {
    use Access::*;
    use Module::*;
    use Role::*;
    if role == SuperAdmin {
        return Full;
    }
    match (module, role) {
        (Hr, Owner) | (Hr, Accountant) | (Hr, HrManager) => Full,
        (Hr, RegionalManager) | (Hr, StoreManager) | (Hr, Auditor) | (Hr, FranchisePartner) | (Hr, Employee) => View,
        (SalesCrm, Owner) | (SalesCrm, RegionalManager) | (SalesCrm, StoreManager) | (SalesCrm, MarketingStaff) => Full,
        (SalesCrm, AssistantManager) => Edit,
        (SalesCrm, Cashier) | (SalesCrm, Accountant) | (SalesCrm, Auditor) => View,
        (Integrations, Owner) | (Integrations, ItAdmin) => Full,
        (Integrations, MarketingStaff) | (Integrations, HrManager) => Edit,
        (Integrations, Accountant) | (Integrations, Auditor) | (Integrations, RegionalManager) | (Integrations, StoreManager) => View,
        (SystemAdmin, Owner) | (SystemAdmin, ItAdmin) => Full,
        (SystemAdmin, Auditor) => View,
        (AiAnalytics, Owner) | (AiAnalytics, RegionalManager) => Full,
        (AiAnalytics, Auditor) => View,
        _ => None,
    }
}

pub fn can(role: Role, action: Action, module: Module) -> bool {
    module_access(role, module).allows(action)
}
