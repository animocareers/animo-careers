"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateOrganizationMember } from "@/app/[locale]/dashboard/settings/organization/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSIGNABLE_ORG_ROLES, type OrgRole } from "@/lib/organization/roles";
import { createUpdateMemberSchema, type UpdateMemberFormValues } from "@/lib/validation/organization-member";

interface MemberDetailFormProps {
  locale: string;
  memberId: string;
  displayName: string;
  email: string;
  role: OrgRole;
  department: string | null;
  /** Called after a successful save — the panel closes in response. */
  onSaved: () => void;
}

/**
 * View/edit form for a single member: name and email are read-only (they
 * belong to the member's own account, not something an org owner edits on
 * their behalf — feature 10 §5). Role and department are editable, except
 * role never appears as editable for the owner's own row — reassigning
 * ownership is a distinct, higher-stakes operation out of scope here.
 */
export function MemberDetailForm({
  locale,
  memberId,
  displayName,
  email,
  role,
  department,
  onSaved,
}: MemberDetailFormProps) {
  const t = useTranslations("OrganizationSettings.teamMembers.panel");
  const tRoles = useTranslations("OrganizationSettings.teamMembers.roles");
  const [formError, setFormError] = useState<string | null>(null);
  const isOwner = role === "owner";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMemberFormValues>({
    resolver: zodResolver(createUpdateMemberSchema(t)),
    defaultValues: {
      role: isOwner ? undefined : role,
      department: department ?? "",
    },
  });

  // Select's displayed value can only resolve a label from its `items` map —
  // without it, a value set before the popup has ever opened (e.g. this
  // pre-filled edit form) falls back to showing the raw enum value.
  const roleItems = Object.fromEntries(ASSIGNABLE_ORG_ROLES.map((r) => [r, tRoles(r)]));

  /** Submits the edited role/department and surfaces any server-side error. */
  async function onSubmit(values: UpdateMemberFormValues) {
    setFormError(null);
    const result = await updateOrganizationMember(locale, memberId, values);
    if (result.status === "error") {
      setFormError(result.message);
      return;
    }
    toast.success(t("savedToast"));
    onSaved();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="member-name">{t("nameLabel")}</Label>
        <Input id="member-name" readOnly value={displayName} className="bg-muted text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="member-email">{t("emailLabel")}</Label>
        <Input id="member-email" readOnly value={email} className="bg-muted text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="member-role">{t("roleLabel")}</Label>
        {isOwner ? (
          <>
            <Input
              id="member-role"
              readOnly
              value={tRoles("owner")}
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">{t("ownerRoleNote")}</p>
          </>
        ) : (
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select items={roleItems} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="member-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ORG_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {tRoles(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="member-department">{t("departmentLabel")}</Label>
        <Controller
          control={control}
          name="department"
          render={({ field }) => (
            <Input
              id="member-department"
              placeholder={t("departmentPlaceholder")}
              aria-invalid={!!errors.department}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
        {errors.department && (
          <p className="text-sm text-destructive">{errors.department.message}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-auto">
        {isSubmitting ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
