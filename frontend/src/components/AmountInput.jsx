import Input from './Input'
export const AmountInput = ({value, onChange, error, ...props}) => (
  <Input type="number" step="0.01" min="0" value={value} onChange={onChange} error={error} placeholder="0.00" {...props} />
)
