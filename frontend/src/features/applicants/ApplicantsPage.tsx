import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import "../applicant/applicant.css";
import { inr, num, pct, titleCase } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useApplicants, useModelCard } from "../../lib/queries";
import { Applicant360 } from "../applicant/Applicant360";

const columnHelper = createColumnHelper<any>();

function ModelStrip() {
  const { data } = useModelCard();
  if (!data) return null;
  const m = data.metrics;
  const items = [
    { label: "ROC-AUC", value: num(m.roc_auc, 3) },
    { label: "KS", value: num(m.ks_statistic, 3) },
    { label: "Lift @ decile", value: `${num(m.lift_top_decile, 2)}×` },
    { label: "Base rate", value: pct(m.base_rate) },
    { label: "Population", value: String(m.n_samples) },
  ];
  return (
    <div className="model-strip">
      {items.map((it) => (
        <div className="model-strip__item" key={it.label}>
          <span className="model-strip__label">{it.label}</span>
          <span className="model-strip__value tabular">{it.value}</span>
        </div>
      ))}
      <div className="model-strip__note">
        Out-of-fold metrics · {data.version}
      </div>
    </div>
  );
}

export function ApplicantsPage() {
  const { id: selected, setId: setSelected } = useActiveApplicant();
  const [showDetail, setShowDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "outcome", desc: true }]);
  
  const { data, isLoading } = useApplicants();

  const openApplicant = (id: string) => {
    setSelected(id);
    setShowDetail(true);
  };

  const filteredData = useMemo(() => {
    let r = data ?? [];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.customer_id.toLowerCase().includes(q)
      );
    }
    return r;
  }, [data, query]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Applicant",
        cell: (info) => (
          <div>
            <div className="atable__name">{info.getValue()}</div>
            <div className="atable__id">{info.row.original.customer_id}</div>
          </div>
        ),
      }),
      columnHelper.accessor("city_tier", {
        header: "Profile",
        cell: (info) => {
          const a = info.row.original;
          return (
            <div className="atable__muted">
              {a.age} · {titleCase(a.employment_type)} · {a.city_tier.replace("_", " ")}
            </div>
          );
        },
      }),
      columnHelper.accessor("verified_monthly_income", {
        header: () => <div style={{ textAlign: "right" }}>Verified Income</div>,
        cell: (info) => <div className="atable__num tabular">{inr(info.getValue())}</div>,
      }),
      columnHelper.accessor("outcome", {
        header: "Outcome",
        id: "outcome",
        sortingFn: (rowA, rowB) => {
          return Number(rowA.original.converted) - Number(rowB.original.converted);
        },
        cell: (info) => {
          const a = info.row.original;
          if (a.converted) {
            return <span className="tag tag--positive">{titleCase(a.loan_type)}</span>;
          }
          return <span className="tag tag--muted">No loan</span>;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: () => <div className="atable__chev"><ChevronRight size={16} /></div>,
      })
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (showDetail && selected) {
    return (
      <Applicant360
        customerId={selected}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">Applicants</h1>
        <p className="workspace__subtitle">
          Book of business scored by the hybrid decision engine
        </p>
      </header>

      <ModelStrip />

      <div className="table-toolbar">
        <div style={{ position: "relative", display: "inline-block" }}>
          <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            className="input"
            style={{ paddingLeft: "36px" }}
            placeholder="Search name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="empty">Loading applicants…</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 4 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.2, delay: 0.1 }}
          className="table-container"
        >
          <table className="atable">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: header.column.id === "verified_monthly_income" ? "flex-end" : "flex-start" }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUp size={12} />,
                          desc: <ArrowDown size={12} />,
                        }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() && <ArrowUpDown size={12} style={{ opacity: 0.3 }} />)}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.02 } }
              }}
            >
              {table.getRowModel().rows.map((row) => (
                <motion.tr 
                  key={row.id} 
                  onClick={() => openApplicant(row.original.customer_id)}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 500, damping: 40 } }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </motion.div>
      )}
    </>
  );
}
