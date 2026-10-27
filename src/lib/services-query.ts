import { queryOptions } from "@tanstack/react-query";
import { listActiveServices } from "@/lib/services.functions";

export const activeServicesQuery = queryOptions({ queryKey: ["active-services"], queryFn: () => listActiveServices(), staleTime: 30000 });