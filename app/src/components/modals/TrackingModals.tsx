import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldRow, TextAreaField, TextField } from "../ui/Field";

export interface CreateDietQueryInput {
  query: string; requester: string; responsible: string; followup: string; remarks: string; resolution?: string;
}

export function DietModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateDietQueryInput) => void }) {
  const [query, setQuery] = useState("");
  const [requester, setRequester] = useState("CEO");
  const [responsible, setResponsible] = useState("");
  const [followup, setFollowup] = useState("2026-09-13");
  const [remarks, setRemarks] = useState("");
  const [resolution, setResolution] = useState("");

  const submit = () => {
    onCreate({
      query: query || "New query",
      requester,
      responsible,
      followup,
      remarks,
      resolution: resolution || undefined,
    });
    setQuery(""); setResponsible(""); setRemarks(""); setResolution("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Diet Query"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Log Query</Button>
        </>
      }
    >
      <TextAreaField label="Query" placeholder="e.g. Request for low-sodium meal plan" value={query} onChange={(e) => setQuery(e.target.value)} />
      <FieldRow>
        <TextField label="Requester" value={requester} onChange={(e) => setRequester(e.target.value)} />
        <TextField label="Responsible Person" placeholder="e.g. Nutritionist / Pantry" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
      </FieldRow>
      <TextField label="Follow-up Date" type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} />
      <TextAreaField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <TextAreaField label="Resolution" placeholder="Filled in once query is resolved" value={resolution} onChange={(e) => setResolution(e.target.value)} />
    </Modal>
  );
}

export interface CreateOtherTaskInput { title: string; owner: string; due: string }

export function OtherTaskModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateOtherTaskInput) => void }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("PA");
  const [due, setDue] = useState("2026-09-20");

  const submit = () => {
    onCreate({ title: title || "Other task", owner, due });
    setTitle("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Other CEO Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Task</Button>
        </>
      }
    >
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <TextField label="Due Date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
    </Modal>
  );
}
