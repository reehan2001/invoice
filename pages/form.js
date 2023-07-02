import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'next/router';
import UpdateForm from '../pages/update.js';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';

import {
  TextField,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Button,
} from "@mui/material";
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

const FormPage = () => {
  const [formList, setFormList] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFormList = async () => {
      try {
        const formsCollection = collection(firestore, 'forms');
        const formsSnapshot = await getDocs(formsCollection);
        const formsData = formsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFormList(formsData);
      } catch (error) {
        console.error('Error retrieving form list:', error);
      }
    };

    fetchFormList();
  }, []);

  const isFormIncomplete = (formId) => {
    const form = formList.find((form) => form.id === formId);
    return (
      form &&
      ((!form.date ||
        !form.poAmount ||
        !form.purchaseNo ||
        form.supplyData.length === 0 ||
        form.labourWorksData.length === 0) &&
        (form.customerName && form.purchaseNo))
    );
  };

  const isFormSubmitted = (formId) => {
    const form = formList.find((form) => form.id === formId);
    return (
      form &&
      form.date &&
      form.poAmount &&
      form.purchaseNo &&
      form.supplyData.length > 0 &&
      form.labourWorksData.length > 0
    );
  };

  const handleUpdateForm = (formId) => {
     router.push(`/?formId=${formId}&customerName=${encodeURIComponent}`);
  };

  const handlePreviewForm = (formId) => {
    const form = formList.find((form) => form.id === formId);
    const customerNameToSubmit =
      form.customerName === 'Others' ? form.otherCustomerName : form.customerName;
    router.push(`/?formId=${formId}&customerName=${encodeURIComponent(customerNameToSubmit)}`);
  };

  const handleRemoveForm = async (formId) => {
    try {
      const formDocRef = doc(firestore, 'forms', formId);
      await deleteDoc(formDocRef);
      console.log('Form deleted with ID:', formId);
  
      // Remove the form from the formList state
      setFormList((prevFormList) =>
        prevFormList.filter((form) => form.id !== formId)
      );
    } catch (error) {
      console.error("Error deleting form: ", error);
    }
  };
  
  const currentFormId = router.query.formId;
  const filteredFormList = formList.filter((form) => form.id !== currentFormId);
  return (
    <Container>
      <div>
        <Typography variant="h2">Invoice-Lists</Typography>
        {currentFormId && (
          <ul>
            {formList.map((form) => (
              <li key={form.id}>
                <p>
                  Name: {form.customerName} - {form.timestamp && form.timestamp.toDate().toString()}
                </p>
                <p>
                  Purchase No: {form.purchaseNo} - {form.timestamp && form.timestamp.toDate().toString()}
                </p>
                <p>Completion: {isFormIncomplete(form.id) ? 'Incomplete' : 'Completed'}</p>
                <Button onClick={() => handleRemoveForm(form.id)}>Remove</Button>
                {isFormIncomplete(form.id) && (
                  <button onClick={() => handleUpdateForm(form.id)}>Update</button>
                )}
                {isFormSubmitted(form.id) && (
                  <button onClick={() => handlePreviewForm(form.id)}>Preview</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {filteredFormList.length > 0 ? (
          <ul>
            {filteredFormList.map((form) => (
              <li key={form.id}>
                <p>
                  Name: {form.customerName} - {form.timestamp && form.timestamp.toDate().toString()}
                </p>
                <p>
                  Purchase No: {form.purchaseNo} - {form.timestamp && form.timestamp.toDate().toString()}
                </p>
                <p>Completion: {isFormIncomplete(form.id) ? 'Incomplete' : 'Completed'}</p>
                <button onClick={() => handleRemoveForm(form.id)}>Remove</button>
                {isFormIncomplete(form.id) && (
                  <button onClick={() => handleUpdateForm(form.id)}>Update</button>
                )}
                {isFormSubmitted(form.id) && (
                  <button onClick={() => handlePreviewForm(form.id)}>Preview</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No forms submitted yet.</p>
        )}
      </div>
    </Container>
  );
 };

 export default FormPage;