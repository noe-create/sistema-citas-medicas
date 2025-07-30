import { ServiceCatalogManagement } from "@/components/service-catalog-management";

export default function ServiciosPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Catálogo de Servicios y Tarifas</h2>
      </div>
      <ServiceCatalogManagement />
    </div>
  );
}
