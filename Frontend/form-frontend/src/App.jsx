import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://api.bbipl.org/api';

function FormBuilder() {
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [publishedData, setPublishedData] = useState(null);

  const addField = (type) => {
    setFields([...fields, { id: Date.now().toString(), type, label: '', options: type === 'radio' ? ['Option 1'] : [], required: true }]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const updateOption = (fieldId, optionIndex, value) => {
    setFields(fields.map((f) => {
      if (f.id === fieldId) {
        const newOptions = [...f.options];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const addOption = (fieldId) => {
    setFields(fields.map((f) => {
      if (f.id === fieldId) {
        return { ...f, options: [...f.options, `Option ${f.options.length + 1}`] };
      }
      return f;
    }));
  };

  const saveForm = async () => {
    try {
      const res = await axios.post(`${API_URL}/forms`, { title, fields });
      setPublishedData({
        formLink: `${window.location.origin}/form/${res.data.formId}`,
        dashboardLink: `${window.location.origin}/dashboard/${res.data.formId}`
      });
    } catch (error) {
      alert("Error saving form: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: 'auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '8px solid #673ab7' }}>
        <h1 style={{ marginTop: 0 }}>Create a New Form</h1>
        <input
          type="text"
          placeholder="Form Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', width: '95%', marginBottom: '20px', padding: '15px', fontSize: '20px', border: 'none', borderBottom: '2px solid #ccc', outline: 'none' }}
        />

        {fields.map((field, index) => (
          <div key={field.id} style={{ border: '1px solid #e0e0e0', padding: '20px', marginBottom: '15px', borderRadius: '8px', background: '#fafafa' }}>
            <span style={{ background: '#e0e0e0', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '10px' }}>
              Question {index + 1} - {field.type.toUpperCase()}
            </span>
            <input
              type="text"
              placeholder="Question Label"
              value={field.label}
              onChange={(e) => updateField(field.id, 'label', e.target.value)}
              style={{ width: '95%', padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', display: 'block', marginBottom: '10px' }}
            />
            
            {field.type === 'radio' && (
              <div style={{ paddingLeft: '10px' }}>
                {field.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <input type="radio" disabled style={{ marginRight: '10px' }} />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(field.id, i, e.target.value)}
                      style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                    />
                  </div>
                ))}
                <button onClick={() => addOption(field.id)} style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}>+ Add Option</button>
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => addField('text')} style={{ padding: '10px 15px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>+ Short Answer</button>
          <button onClick={() => addField('radio')} style={{ padding: '10px 15px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>+ Multiple Choice</button>
          <button onClick={() => addField('file')} style={{ padding: '10px 15px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>+ File Upload</button>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button onClick={saveForm} style={{ background: '#673ab7', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            Publish Form
          </button>
        </div>

        {publishedData && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Published Successfully!</h3>
            <p style={{ margin: '5px 0' }}><strong>Live Form Link:</strong> <a href={publishedData.formLink} target="_blank" rel="noopener noreferrer" style={{color: '#1565c0'}}>{publishedData.formLink}</a></p>
            <p style={{ margin: '5px 0' }}><strong>Dashboard Link:</strong> <a href={publishedData.dashboardLink} target="_blank" rel="noopener noreferrer" style={{color: '#d32f2f'}}>{publishedData.dashboardLink}</a></p>
          </div>
        )}
      </div>
    </div>
  );
}

function FormViewer() {
  const { formId } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [files, setFiles] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await axios.get(`${API_URL}/forms/${formId}`);
        setFormData(res.data);
      } catch (error) {
        alert("Form not found or server error");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId]);

  const handleResponseChange = (fieldId, value) => {
    setResponses({ ...responses, [fieldId]: value });
  };

  const handleFileChange = (fieldId, file) => {
    setFiles({ ...files, [fieldId]: file });
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.keys(responses).forEach((key) => {
      data.append(key, responses[key]);
    });

    Object.keys(files).forEach((key) => {
      data.append(key, files[key]);
    });

    try {
      await axios.post(`${API_URL}/responses/${formId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (error) {
      alert("Submission Failed (Check AWS Settings): " + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  if (!formData) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Form not found!</div>;

  if (submitted) {
    return (
      <div style={{ padding: '30px', maxWidth: '600px', margin: '50px auto' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', borderTop: '8px solid #673ab7', textAlign: 'center' }}>
          <h2>{formData.title}</h2>
          <p>Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '10px', borderTop: '8px solid #673ab7' }}>
        <h1 style={{ marginTop: 0 }}>{formData.title}</h1>
        <hr style={{ border: '0', height: '1px', background: '#ddd', marginBottom: '30px' }} />
        
        <form onSubmit={submitResponse}>
          {formData.fields.map((field) => (
            <div key={field.id} style={{ marginBottom: '25px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '15px', fontWeight: '500', fontSize: '18px' }}>
                {field.label} <span style={{ color: 'red' }}>*</span>
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  onChange={(e) => handleResponseChange(field.id, e.target.value)}
                  style={{ width: '95%', padding: '10px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none' }}
                  required
                />
              )}
              
              {field.type === 'radio' && (
                <div>
                  {field.options.map((opt, i) => (
                    <div key={i} style={{ marginBottom: '10px' }}>
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`radio-${field.id}`}
                          value={opt}
                          onChange={(e) => handleResponseChange(field.id, e.target.value)}
                          required
                          style={{ marginRight: '10px' }}
                        />
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {field.type === 'file' && (
                <input
                  type="file"
                  onChange={(e) => handleFileChange(field.id, e.target.files[0])}
                  style={{ width: '95%', padding: '10px' }}
                  required
                />
              )}
            </div>
          ))}
          <button type="submit" style={{ background: '#673ab7', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await axios.get(`${API_URL}/responses/${formId}`);
        setResponses(res.data);
      } catch (error) {
        alert("Error fetching dashboard: " + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', borderTop: '8px solid #2e7d32' }}>
        <h2>Form Dashboard - Total Responses ({responses.length})</h2>
        {responses.length === 0 ? (
          <p>No responses yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Submission Time</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Submitted Answers & Files</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((resp) => (
                  <tr key={resp.responseId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', verticalAlign: 'top' }}>{new Date(resp.submittedAt).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>
                      {Object.entries(resp.answers).map(([qId, ans]) => (
                        <div key={qId} style={{ marginBottom: '5px', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>Question ID: {qId}</span><br />
                          <strong>Ans: </strong> 
                          {typeof ans === 'string' && ans.startsWith('http') ? (
                            <a href={ans} target="_blank" rel="noopener noreferrer" style={{ color: '#1565c0', textDecoration: 'none', fontWeight: 'bold' }}>📄 View Uploaded File</a>
                          ) : (
                            ans
                          )}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ backgroundColor: '#f0ebf8', minHeight: '100vh', padding: '20px 0' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FormBuilder />} />
          <Route path="/form/:formId" element={<FormViewer />} />
          <Route path="/dashboard/:formId" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;