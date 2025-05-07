const mongoose = require("mongoose");

const AdminPermissionSchema = new mongoose.Schema(
  {
    permissions: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true }
        }
    ]
  }
);

const AdminRolesSchema = new mongoose.Schema(
  {
    roles: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true }
        }
    ]
  }
);

const AdminPermission = mongoose.model("adminPermission", AdminPermissionSchema);
const AdminRoles = mongoose.model("adminRoles", AdminRolesSchema);
module.exports = { AdminPermission, AdminRoles };
