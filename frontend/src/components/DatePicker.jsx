export const DatePicker = ({ value, onChange }) => (
  <input type="date" value={value} onChange={e => onChange(e.target.value)} className="px-3 py-2 border rounded-lg" />
)
