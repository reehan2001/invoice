import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'next/router';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const UpdateForm = ({ formId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const docRef = doc(firestore, 'forms', formId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const formData = docSnap.data();
          setTitle(formData.title);
          setContent(formData.content);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error retrieving document:', error);
      }
    };

    fetchFormData();
  }, [firestore, formId]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await updateDoc(doc(firestore, 'forms', formId), {
        title,
        content,
      });

      console.log('Document updated successfully');
      setTitle('');
      setContent('');
      router.push('/index'); // Redirect to index page
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button type="submit">Update</button>
    </form>
  );
};

export default UpdateForm;
