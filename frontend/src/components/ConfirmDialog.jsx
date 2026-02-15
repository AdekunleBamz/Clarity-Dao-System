export const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded">Confirm</button>
        <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded">Cancel</button>
      </div>
    </div>
  </div>
)
