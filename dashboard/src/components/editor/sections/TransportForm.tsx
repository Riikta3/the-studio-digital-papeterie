"use client";

import { useTranslations } from "next-intl";

import { newId, useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ListEditor } from "../fields/ListEditor";
import { SectionIntro } from "../fields/SectionIntro";
import { SelectField } from "../fields/SelectField";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { keyedRows, text } from "../fields/coerce";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

/** The icons the server accepts; anything else is saved as `Car`. */
const TRANSPORT_TYPES = ["Train", "Plane", "Bus", "Car", "Ship"] as const;
type TransportType = (typeof TRANSPORT_TYPES)[number];

type TransportOption = {
  id: string;
  iconType: TransportType;
  title: string;
  description: string;
};

function isTransportType(value: unknown): value is TransportType {
  return typeof value === "string" && (TRANSPORT_TYPES as readonly string[]).includes(value);
}

/** The saved modes, shaped for the list. */
function readOptions(value: unknown): TransportOption[] {
  return keyedRows(value, "transport").map((option) => ({
    id: option.id,
    iconType: isTransportType(option.iconType) ? option.iconType : "Car",
    title: text(option.title),
    description: text(option.description),
  }));
}

/**
 * How to get to the wedding, mode by mode, and the carpool board.
 *
 * A mode appears on the invitation only once it has directions — a title
 * alone ("En train") says nothing to a guest — and the carpool block only
 * once it has a link.
 */
export function TransportForm() {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules.transport ?? {};
  const patch = (values: ModuleConfig) =>
    updateModule("transport", (current) => ({ ...current, ...values }));

  const typeOptions = TRANSPORT_TYPES.map((value) => ({
    value,
    label: t(`transportTypes.${value}`),
  }));

  return (
    <FormLayout>
      <SectionIntro section="transport" />

      <FieldGroup title={t("groups.transportModes")}>
        <ListEditor
          items={readOptions(config.options)}
          onChange={(options) => patch({ options })}
          summary={(option) => option.title.trim() || t(`transportTypes.${option.iconType}`)}
          createItem={() => ({ id: newId(), iconType: "Train", title: "", description: "" })}
          addLabel={t("actions.addTransport")}
          emptyLabel={t("empty.transport")}
          max={10}
          hasContent={(option) => Boolean(option.title.trim() || option.description.trim())}
          renderItem={(option, change) => (
            <>
              <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                <SelectField
                  label={t("fields.transportType")}
                  value={option.iconType}
                  onChange={(iconType) => change({ iconType })}
                  options={typeOptions}
                />
                <TextField
                  label={t("fields.transportTitle")}
                  value={option.title}
                  onChange={(title) => change({ title })}
                  placeholder={t("placeholders.transportTitle")}
                  maxLength={80}
                />
              </div>
              <TextField
                label={t("fields.transportDescription")}
                value={option.description}
                onChange={(description) => change({ description })}
                multiline
                rows={3}
                maxLength={1000}
              />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.carpool")}>
        <TextField
          label={t("fields.carpoolUrl")}
          type="url"
          value={text(config.carpoolUrl)}
          onChange={(carpoolUrl) => patch({ carpoolUrl })}
          placeholder={t("placeholders.url")}
          maxLength={2000}
        />
        <TextField
          label={t("fields.carpoolLabel")}
          value={text(config.carpoolLinkLabel)}
          onChange={(carpoolLinkLabel) => patch({ carpoolLinkLabel })}
          maxLength={80}
        />
        <TextField
          label={t("fields.carpoolDescription")}
          value={text(config.carpoolDescription)}
          onChange={(carpoolDescription) => patch({ carpoolDescription })}
          multiline
          rows={2}
          maxLength={1000}
        />
      </FieldGroup>

      <SlotFields section="transport" />
    </FormLayout>
  );
}
