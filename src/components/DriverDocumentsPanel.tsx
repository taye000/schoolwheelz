"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";
import styled from "styled-components";
import toast from "react-hot-toast";

type DocumentType = "idFront" | "idBack" | "license" | "goodConduct";

interface DriverDocumentItem {
  _id: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

const DOCUMENTS: { type: DocumentType; label: string }[] = [
  { type: "idFront", label: "National ID, front" },
  { type: "idBack", label: "National ID, back" },
  { type: "license", label: "Driving licence" },
  { type: "goodConduct", label: "Certificate of good conduct" },
];

export default function DriverDocumentsPanel({
  driverId,
  editable = true,
}: {
  driverId: string;
  editable?: boolean;
}) {
  const [documents, setDocuments] = useState<DriverDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);

  const loadDocuments = async () => {
    try {
      const response = await axios.get(`/api/drivers/${driverId}/documents`, { withCredentials: true });
      setDocuments(response.data.data ?? []);
    } catch {
      toast.error("Could not load driver documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, [driverId]);

  const upload = async (type: DocumentType, file?: File) => {
    if (!file) return;
    const form = new FormData();
    form.set("type", type);
    form.set("file", file);
    setUploading(type);
    try {
      await axios.post(`/api/drivers/${driverId}/documents`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadDocuments();
      toast.success("Document securely uploaded.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Could not upload this document.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <Panel>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#20211E" }}>Driver documents</Typography>
        <Typography variant="body2" sx={{ color: "#646358" }}>
          PDF, JPEG, or PNG; maximum 5 MB per file. Files are encrypted and visible only to you and administrators.
        </Typography>
      </Box>
      {editable && <Alert severity="info" sx={{ mb: 1.5 }}>All four documents are required before you can go online.</Alert>}
      {loading ? (
        <CircularProgress size={22} />
      ) : (
        <DocumentList>
          {DOCUMENTS.map(({ type, label }) => {
            const document = documents.find((item) => item.type === type);
            return (
              <DocumentRow key={type}>
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#292923" }}>{label}</Typography>
                  <Typography variant="caption" sx={{ color: document ? "#2F7D54" : "#646358" }}>
                    {document ? `Received ${new Date(document.createdAt).toLocaleDateString()}` : "Not uploaded"}
                  </Typography>
                </div>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {document && (
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href={`/api/drivers/${driverId}/documents/${document._id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </Button>
                  )}
                  {editable && (
                    <Button
                      size="small"
                      component="label"
                      startIcon={uploading === type ? <CircularProgress size={14} /> : <UploadFileIcon />}
                      disabled={uploading !== null}
                    >
                      {document ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        hidden
                        onChange={(event) => {
                          void upload(type, event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </Button>
                  )}
                </Box>
              </DocumentRow>
            );
          })}
        </DocumentList>
      )}
    </Panel>
  );
}

const Panel = styled.section`
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #E6E0D0;
  border-radius: 6px;
  background: #FFFDF6;
`;
const DocumentList = styled.div`display: grid;`;
const DocumentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 54px;
  padding: 8px 0;
  border-top: 1px solid #EAE7DD;
  @media (max-width: 500px) { align-items: flex-start; flex-direction: column; }
`;