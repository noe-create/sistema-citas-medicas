
import { cn } from "@/lib/utils";
import * as React from "react";

export const FormSection = ({ title, icon, children, className }: { title: string, icon?: React.ReactNode, children: React.ReactNode, className?: string }) => (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
        <h3 className="text-lg font-medium leading-none flex items-center gap-2">
            {icon}
            {title}
        </h3>
        <div className={cn("space-y-4", icon && "pl-6")}>{children}</div>
    </div>
);
