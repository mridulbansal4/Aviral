/** Compact applicant selector used by the Timeline and Graph screens. */

import { useApplicants } from "../lib/queries";

export function ApplicantPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { data } = useApplicants();
  const applicants = data ?? [];

  return (
    <select
      className="picker"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Select an applicant…
      </option>
      {applicants.map((a) => (
        <option key={a.customer_id} value={a.customer_id}>
          {a.name} · {a.customer_id}
        </option>
      ))}
    </select>
  );
}
