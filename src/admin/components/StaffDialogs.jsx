import ConfirmDialog from './ConfirmDialog';
import StaffForm from './StaffForm';
import TerminateDialog from './TerminateDialog';
import { useAdmin } from '../AdminContext';

/**
 * Renders whichever staff dialog is open.
 * dialog = { type: 'hire' | 'edit' | 'terminate' | 'delete' | 'deactivate', person? }
 */
export default function StaffDialogs({ dialog, onClose, onRemoved }) {
  const { hireStaff, updateStaff, setStaffActive, terminateStaff, deleteStaff, session } = useAdmin();
  if (!dialog) return null;
  const { type, person } = dialog;
  // Hiring, firing and deleting are administrator-only (the server enforces it too).
  if (['hire', 'terminate', 'delete'].includes(type) && session?.type !== 'admin') return null;

  if (type === 'hire') {
    return <StaffForm mode="hire" onSubmit={hireStaff} onClose={onClose} />;
  }
  if (type === 'edit') {
    return (
      <StaffForm
        mode="edit"
        initial={person}
        onClose={onClose}
        onSubmit={async (values) => {
          const result = await updateStaff(person.id, values);
          if (result.ok && !result.tempPassword) onClose(); // a promoted Manager's temporary password is shown first
          return result;
        }}
      />
    );
  }
  if (type === 'terminate') {
    return (
      <TerminateDialog
        person={person}
        onClose={onClose}
        onConfirm={async (details) => {
          onClose();
          const result = await terminateStaff(person.id, details);
          if (result.ok) onRemoved?.();
        }}
      />
    );
  }
  if (type === 'delete') {
    return (
      <ConfirmDialog
        title={`Delete ${person.name}?`}
        tone="danger"
        message="This permanently removes their record, including sign-in history, from the database. It cannot be undone."
        confirmLabel="Delete permanently"
        onClose={onClose}
        onConfirm={async () => {
          onClose();
          const result = await deleteStaff(person.id);
          if (result.ok) onRemoved?.();
        }}
      />
    );
  }
  if (type === 'deactivate') {
    return (
      <ConfirmDialog
        title={`Deactivate ${person.name}?`}
        message="They will not be able to sign in until you activate the account again. Their record and history are kept."
        confirmLabel="Deactivate account"
        onClose={onClose}
        onConfirm={() => {
          setStaffActive(person.id, false);
          onClose();
        }}
      />
    );
  }
  return null;
}
