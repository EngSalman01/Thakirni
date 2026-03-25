import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// jspdf-autotable extends jsPDF — declare augmentation
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number }
  }
}

interface Memory {
  title: string
  content: string
  category: string
  created_at: string
}

interface Plan {
  title: string
  plan_date: string
  status: string
  category: string
  plan_time?: string | null
}

interface Habit {
  title: string
  category: string
  frequency: string
  current_streak?: number
}

interface Goal {
  title: string
  status: string
  deadline?: string | null
  progress_pct?: number
}

type ExportData =
  | { type: "memories"; items: Memory[]; userName?: string }
  | { type: "plans"; items: Plan[]; userName?: string }
  | { type: "habits"; items: Habit[]; userName?: string }
  | { type: "goals"; items: Goal[]; userName?: string }

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  // Header
  doc.setFillColor(37, 82, 202)
  doc.rect(0, 0, pageWidth, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Thakirni \u2014 \u0630\u0643\u0631\u0646\u064a", 14, 13)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Exported: ${now}${data.userName ? ` \u00b7 ${data.userName}` : ""}`, 14, 22)
  doc.setTextColor(30, 30, 30)

  const titles: Record<string, string> = {
    memories: "Memories",
    plans: "Plans",
    habits: "Habits",
    goals: "Goals",
  }

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(titles[data.type], 14, 40)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`${data.items.length} items`, 14, 46)
  doc.setTextColor(30, 30, 30)

  if (data.type === "memories") {
    autoTable(doc, {
      startY: 52,
      head: [["Title", "Category", "Date", "Content"]],
      body: (data.items as Memory[]).map(m => [
        m.title,
        m.category ?? "—",
        new Date(m.created_at).toLocaleDateString("en-GB"),
        m.content?.slice(0, 80) ?? "—",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 82, 202], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 243, 242] },
      columnStyles: { 3: { cellWidth: 70 } },
    })
  } else if (data.type === "plans") {
    autoTable(doc, {
      startY: 52,
      head: [["Title", "Date", "Time", "Status", "Category"]],
      body: (data.items as Plan[]).map(p => [
        p.title,
        p.plan_date ?? "—",
        p.plan_time ?? "—",
        p.status,
        p.category ?? "—",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [173, 29, 127], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 243, 242] },
    })
  } else if (data.type === "habits") {
    autoTable(doc, {
      startY: 52,
      head: [["Title", "Category", "Frequency", "Current Streak"]],
      body: (data.items as Habit[]).map(h => [
        h.title,
        h.category ?? "—",
        h.frequency ?? "daily",
        `${h.current_streak ?? 0} days`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 243, 242] },
    })
  } else if (data.type === "goals") {
    autoTable(doc, {
      startY: 52,
      head: [["Title", "Status", "Deadline", "Progress"]],
      body: (data.items as Goal[]).map(g => [
        g.title,
        g.status,
        g.deadline ? new Date(g.deadline).toLocaleDateString("en-GB") : "—",
        `${g.progress_pct ?? 0}%`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 243, 242] },
    })
  }

  // Footer on each page
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Thakirni \u00b7 Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: "center" })
  }

  doc.save(`thakirni-${data.type}-${now.replace(/ /g, "-")}.pdf`)
}
