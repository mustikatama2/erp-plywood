import { useState } from "react";
import { PageHeader, Card, Btn, FormField } from "../../components/ui";
import { COMPANY } from "../../data/seed";

export default function CompanySettings() {
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <PageHeader title="Company Settings" />
      <div className="max-w-2xl">
        <Card title="Company Information">
          <div className="space-y-4">
            {[["Legal Name",COMPANY.name],["Short Name",COMPANY.short],["Address",COMPANY.address],
              ["NPWP",COMPANY.npwp],["Base Currency",COMPANY.currency],
              ["Fiscal Year Start",COMPANY.fiscal_year_start]].map(([label,value])=>(
              <div key={label}>
                <label className="erp-label">{label}</label>
                <input defaultValue={value} className="erp-input" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Btn onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}}>
                {saved?"✅ Saved!":"Save Changes"}
              </Btn>
            </div>
          </div>
        </Card>

        <Card title="System Preferences" className="mt-4">
          <div className="space-y-4">
            <div>
              <label className="erp-label">Default Tax Rate (PPN)</label>
              <input defaultValue="11" type="number" className="erp-input w-32" />
            </div>
            <div>
              <label className="erp-label">USD Exchange Rate (to IDR)</label>
              <input defaultValue="15560" type="number" className="erp-input w-48" />
            </div>
            <div>
              <label className="erp-label">SVLK Certificate No (default)</label>
              <input defaultValue="SVLK-2026-0234" className="erp-input" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="auto-je" defaultChecked className="w-4 h-4 accent-blue-600" />
              <label htmlFor="auto-je" className="text-sm text-gray-700">Auto-create journal entries on invoice posting</label>
            </div>
            <div className="flex justify-end">
              <Btn>Save Preferences</Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
