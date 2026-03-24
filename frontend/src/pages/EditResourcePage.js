import { Navigate, useParams } from 'react-router-dom';
import PostResourcePage from './PostResourcePage';

function EditResourcePage({ currentUser, resources, onSubmit }) {
  const { id } = useParams();
  const editableResource = resources.find(
    (resource) => String(resource.id) === String(id) && resource.ownerEmail === currentUser?.email
  );

  if (!editableResource) {
    return <Navigate to="/resources" replace />;
  }

  return (
    <PostResourcePage
      currentUser={currentUser}
      onSubmit={(formData) => onSubmit(editableResource.id, formData)}
      initialData={{
        title: editableResource.title,
        category: editableResource.category,
        condition: editableResource.condition,
        department: editableResource.department,
        location: editableResource.location,
        imageUrl: editableResource.image || '',
        description: editableResource.description
      }}
      title="Edit Resource"
      helperText="Update the details of your resource listing."
      buttonText="Save Changes"
      successMessage="Resource updated successfully. Redirecting to the marketplace..."
    />
  );
}

export default EditResourcePage;
