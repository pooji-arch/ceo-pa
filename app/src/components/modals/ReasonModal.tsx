import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TextAreaField, TextField } from "../ui/Field";

export function ReasonModal({
  open,
  onClose,
  title,
  reasonLabel = "Reason",
  dateLabel,
  defaultDate,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  reasonLabel?: string;
  dateLabel?: string;
  defaultDate?: string;
  onSubmit: (reason: string, date?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");

  const submit = () => {
    onSubmit(reason, dateLabel ? date : undefined);
    setReason("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Confirm</Button>
        </>
      }
    >
      <TextAreaField label={reasonLabel} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required by edge-case handling rules" />
      {dateLabel && (
        <TextField label={dateLabel} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}
    </Modal>
  );
}
