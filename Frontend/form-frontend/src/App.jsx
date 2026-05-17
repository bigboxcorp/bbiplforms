import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://api.bbipl.org/api';

function AdminDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = async () => {
    try {
      const res = await axios.get(`${API_URL}/forms`);
      setForms(res.data);
    } catch (error) { alert('Error fetching forms'); } finally { setLoading(false); }
  };

  const deleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await axios.delete(`${API_URL}/forms/${formId}`);
        setForms(forms.filter((f) => f.formId !== formId));
      } catch (error) { alert('Error deleting form'); }
    }
  };

  if (loading) return <div style={{ padding: '30px', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Custom Form Generator Panel</h2>
        <Link to="/create" style={{ background: '#28a745', color: 'white', padding: '10px 20px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>+ Create New Form</Link>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3>Your Created Forms ({forms.length})</h3>
        {forms.length === 0 ? (
          <p>No forms created yet. Click the button above to start.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Form Title</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.formId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{form.title || 'Untitled Form'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <a href={`${window.location.origin}/form/${form.formId}`} target="_blank" rel="noopener noreferrer" style={{ background: '#007bff', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>Public Link</a>
                    <Link to={`/responses/${form.formId}`} style={{ background: '#17a2b8', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>Responses</Link>
                    <Link to={`/edit/${form.formId}`} style={{ background: '#ffc107', color: 'black', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Edit</Link>
                    <button onClick={() => deleteForm(form.formId)} style={{ background: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormBuilder() {
  const { formId } = useParams();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [publishedData, setPublishedData] = useState(null);

  useEffect(() => {
    if (formId) {
      const fetchExistingForm = async () => {
        try {
          const res = await axios.get(`${API_URL}/forms/${formId}`);
          setTitle(res.data.title);
          setFields(res.data.fields || []);
        } catch (error) { alert('Error loading form data'); }
      };
      fetchExistingForm();
    }
  }, [formId]);

  const addBlankQuestion = () => {
    const newField = {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      required: false,
      options: ['Option 1'],
      rows: ['Row 1'],
      columns: ['Column 1'],
      scaleMin: 1,
      scaleMax: 5,
      maxFileCount: 1,
      maxFileSize: 10,
      valType: 'none',
      valCondition: '',
      valNumber1: '',
      valNumber2: '',
      valText: '',
      valError: ''
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const deleteField = (id) => { setFields(fields.filter((f) => f.id !== id)); };

  const moveField = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    setFields(newFields);
  };

  const addListItem = (id, key, label) => {
    setFields(fields.map((f) => f.id === id ? { ...f, [key]: [...f[key], `${label} ${f[key].length + 1}`] } : f));
  };

  const updateListItem = (id, key, index, value) => {
    setFields(fields.map((f) => {
      if (f.id === id) {
        const newList = [...f[key]];
        newList[index] = value;
        return { ...f, [key]: newList };
      }
      return f;
    }));
  };

  const saveForm = async () => {
    try {
      let finalFormId = formId;
      if (formId) {
        await axios.put(`${API_URL}/forms/${formId}`, { title, fields });
      } else {
        const res = await axios.post(`${API_URL}/forms`, { title, fields });
        finalFormId = res.data.formId;
      }
      const fLink = `${window.location.origin}/form/${finalFormId}`;
      const dLink = `${window.location.origin}/responses/${finalFormId}`;
      setPublishedData({
        formLink: fLink,
        dashboardLink: dLink,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fLink)}`
      });
    } catch (error) { alert("Error saving form: " + (error.response?.data?.error || error.message)); }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</Link>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '8px solid #007bff' }}>
        <h2>{formId ? 'Edit Form' : 'Custom Form Generator'}</h2>
        <input type="text" placeholder="Form Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '95%', padding: '12px', fontSize: '24px', marginBottom: '20px', border: 'none', borderBottom: '2px solid #ccc', outline: 'none', fontWeight: 'bold' }} />

        {fields.map((field, index) => (
          <div key={field.id} style={{ border: '1px solid #ddd', padding: '25px', marginBottom: '20px', borderRadius: '8px', background: '#fdfdfd', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => moveField(index, 'up')} disabled={index === 0} style={{ padding: '4px 8px', cursor: 'pointer' }}>▲</button>
                <button onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1} style={{ padding: '4px 8px', cursor: 'pointer' }}>▼</button>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <select value={field.type} onChange={(e) => updateField(field.id, 'type', e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa' }}>
                  <option value="text">Short Answer</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="radio">Multiple Choice</option>
                  <option value="checkbox">Checkboxes</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="file">File Upload</option>
                  <option value="scale">Linear Scale</option>
                  <option value="grid-radio">Multiple Choice Grid</option>
                  <option value="grid-checkbox">Checkbox Grid</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                </select>
                <button onClick={() => deleteField(field.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>

            <input type="text" placeholder="Question Title" value={field.label} onChange={(e) => updateField(field.id, 'label', e.target.value)} style={{ width: '95%', padding: '12px', margin: '20px 0 10px 0', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }} />

            {['text', 'paragraph'].includes(field.type) && (
              <div style={{ marginTop: '10px', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
                <strong>Response Validation: </strong>
                <select value={field.valType} onChange={(e) => updateField(field.id, 'valType', e.target.value)} style={{ margin: '0 10px', padding: '5px' }}>
                  <option value="none">None</option>
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                  <option value="length">Length</option>
                  <option value="regex">Regular Expression</option>
                </select>

                {field.valType === 'number' && (
                  <select value={field.valCondition} onChange={(e) => updateField(field.id, 'valCondition', e.target.value)} style={{ marginRight: '10px', padding: '5px' }}>
                    <option value="">Select condition</option>
                    <option value=">">Greater than</option>
                    <option value=">=">Greater than or equal to</option>
                    <option value="<">Less than</option>
                    <option value="<=">Less than or equal to</option>
                    <option value="==">Equal to</option>
                    <option value="!=">Not equal to</option>
                    <option value="between">Between</option>
                    <option value="is_number">Is number</option>
                    <option value="whole_number">Whole number</option>
                  </select>
                )}
                {field.valType === 'text' && (
                  <select value={field.valCondition} onChange={(e) => updateField(field.id, 'valCondition', e.target.value)} style={{ marginRight: '10px', padding: '5px' }}>
                    <option value="">Select condition</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Doesn't contain</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                  </select>
                )}
                {field.valType === 'length' && (
                  <select value={field.valCondition} onChange={(e) => updateField(field.id, 'valCondition', e.target.value)} style={{ marginRight: '10px', padding: '5px' }}>
                    <option value="">Select condition</option>
                    <option value="max_char">Maximum character count</option>
                    <option value="min_char">Minimum character count</option>
                  </select>
                )}
                {field.valType === 'regex' && (
                  <select value={field.valCondition} onChange={(e) => updateField(field.id, 'valCondition', e.target.value)} style={{ marginRight: '10px', padding: '5px' }}>
                    <option value="">Select condition</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Doesn't contain</option>
                    <option value="matches">Matches</option>
                    <option value="not_matches">Doesn't match</option>
                  </select>
                )}

                {['>', '>=', '<', '<=', '==', '!=', 'contains', 'not_contains', 'matches', 'not_matches', 'max_char', 'min_char'].includes(field.valCondition) && (
                  <input type="text" placeholder="Value/Pattern" value={field.valNumber1} onChange={(e) => updateField(field.id, 'valNumber1', e.target.value)} style={{ padding: '5px', marginRight: '10px', width: '120px' }} />
                )}
                {field.valCondition === 'between' && (
                  <>
                    <input type="number" placeholder="Min" value={field.valNumber1} onChange={(e) => updateField(field.id, 'valNumber1', e.target.value)} style={{ padding: '5px', width: '80px', marginRight: '5px' }} />
                    <input type="number" placeholder="Max" value={field.valNumber2} onChange={(e) => updateField(field.id, 'valNumber2', e.target.value)} style={{ padding: '5px', width: '80px', marginRight: '10px' }} />
                  </>
                )}
                {field.valType !== 'none' && (
                  <input type="text" placeholder="Custom error text" value={field.valError} onChange={(e) => updateField(field.id, 'valError', e.target.value)} style={{ padding: '5px', width: '150px' }} />
                )}
              </div>
            )}

            {field.type === 'file' && (
              <div style={{ marginTop: '10px', background: '#e9ecef', padding: '15px', borderRadius: '5px' }}>
                <label style={{ marginRight: '15px' }}><strong>Max Files:</strong> 
                  <select value={field.maxFileCount} onChange={(e) => updateField(field.id, 'maxFileCount', parseInt(e.target.value))} style={{ marginLeft: '10px', padding: '5px' }}>
                    {[1, 2, 3, 4, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label><strong>Max Size (MB):</strong> 
                  <select value={field.maxFileSize} onChange={(e) => updateField(field.id, 'maxFileSize', parseInt(e.target.value))} style={{ marginLeft: '10px', padding: '5px' }}>
                    <option value="1">1 MB</option><option value="5">5 MB</option><option value="10">10 MB</option><option value="50">50 MB</option><option value="100">100 MB</option>
                  </select>
                </label>
              </div>
            )}

            {field.type === 'scale' && (
              <div style={{ marginTop: '10px' }}>
                <select value={field.scaleMin} onChange={(e) => updateField(field.id, 'scaleMin', parseInt(e.target.value))} style={{ padding: '5px', marginRight: '10px' }}><option value="0">0</option><option value="1">1</option></select>
                to
                <select value={field.scaleMax} onChange={(e) => updateField(field.id, 'scaleMax', parseInt(e.target.value))} style={{ padding: '5px', marginLeft: '10px' }}>
                  {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}

            {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
              <div style={{ marginTop: '10px' }}>
                {field.options.map((opt, i) => (
                  <input key={i} type="text" value={opt} onChange={(e) => updateListItem(field.id, 'options', i, e.target.value)} style={{ display: 'block', margin: '8px 0', padding: '8px', width: '70%', borderRadius: '4px', border: '1px solid #ccc' }} />
                ))}
                <button onClick={() => addListItem(field.id, 'options', 'Option')} style={{ padding: '6px 12px', marginTop: '5px', cursor: 'pointer' }}>+ Add Option</button>
              </div>
            )}

            {['grid-radio', 'grid-checkbox'].includes(field.type) && (
              <div style={{ display: 'flex', gap: '40px', marginTop: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h5>Rows</h5>
                  {field.rows.map((row, i) => (
                    <input key={i} type="text" value={row} onChange={(e) => updateListItem(field.id, 'rows', i, e.target.value)} style={{ display: 'block', margin: '5px 0', padding: '6px', width: '90%' }} />
                  ))}
                  <button onClick={() => addListItem(field.id, 'rows', 'Row')}>+ Add Row</button>
                </div>
                <div style={{ flex: 1 }}>
                  <h5>Columns</h5>
                  {field.columns.map((col, i) => (
                    <input key={i} type="text" value={col} onChange={(e) => updateListItem(field.id, 'columns', i, e.target.value)} style={{ display: 'block', margin: '5px 0', padding: '6px', width: '90%' }} />
                  ))}
                  <button onClick={() => addListItem(field.id, 'columns', 'Column')}>+ Add Column</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'right' }}>
              <label style={{ fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={field.required || false} onChange={(e) => updateField(field.id, 'required', e.target.checked)} style={{ transform: 'scale(1.2)', marginRight: '8px' }} />
                Required
              </label>
            </div>
          </div>
        ))}

        <button onClick={addBlankQuestion} style={{ display: 'block', width: '100%', padding: '15px', background: '#f0f4f9', border: '2px dashed #007bff', color: '#007bff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '20px' }}>
          + Add Question
        </button>

        <button onClick={saveForm} style={{ display: 'block', marginTop: '30px', width: '100%', background: '#28a745', color: 'white', padding: '16px', border: 'none', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
          {formId ? 'Update Form Changes' : 'Generate Form & QR Code'}
        </button>

        {publishedData && (
          <div style={{ marginTop: '20px', padding: '25px', background: '#e2f0d9', border: '1px solid #385723', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>Saved Successfully!</h3>
              <p style={{ margin: '5px 0' }}><strong>Form Link:</strong> <a href={publishedData.formLink} target="_blank" rel="noopener noreferrer">{publishedData.formLink}</a></p>
              <p style={{ margin: '5px 0' }}><strong>Responses Board:</strong> <a href={publishedData.dashboardLink} target="_blank" rel="noopener noreferrer">{publishedData.dashboardLink}</a></p>
            </div>
            <div style={{ textAlign: 'center', background: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <img src={publishedData.qrCodeUrl} alt="Form QR Code" style={{ width: '120px', height: '120px' }} />
              <br /><small style={{ fontWeight: 'bold' }}>Scan to Fill</small>
            </div>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await axios.get(`${API_URL}/forms/${formId}`);
        setFormData(res.data);
      } catch (error) { alert("Form not found"); }
    };
    fetchForm();
  }, [formId]);

  const handleSimpleChange = (qId, val) => { setResponses({ ...responses, [qId]: val }); };

  const handleCheckboxChange = (qId, option, checked) => {
    const current = responses[qId] ? JSON.parse(responses[qId]) : [];
    const updated = checked ? [...current, option] : current.filter((o) => o !== option);
    setResponses({ ...responses, [qId]: JSON.stringify(updated) });
  };

  const handleGridChange = (qId, row, col, isCheckbox) => {
    const current = responses[qId] ? JSON.parse(responses[qId]) : {};
    if (isCheckbox) {
      const rowVals = current[row] || [];
      current[row] = rowVals.includes(col) ? rowVals.filter((v) => v !== col) : [...rowVals, col];
    } else {
      current[row] = col;
    }
    setResponses({ ...responses, [qId]: JSON.stringify(current) });
  };

  const handleFileAccumulator = (qId, newFileList, maxCount, maxSizeMB) => {
    const newFiles = Array.from(newFileList);
    const existingFiles = files[qId] || [];
    
    if (existingFiles.length + newFiles.length > maxCount) {
      alert(`You can only upload a maximum of ${maxCount} files.`);
      return;
    }

    for (let file of newFiles) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
    }
    setFiles({ ...files, [qId]: [...existingFiles, ...newFiles] });
  };

  const removeFile = (qId, index) => {
    const updated = [...files[qId]];
    updated.splice(index, 1);
    setFiles({ ...files, [qId]: updated });
  };

  const executeValidation = (field, value) => {
    if (field.valType === 'none' || !value) return null;
    const err = field.valError || 'Invalid input.';
    
    if (field.valType === 'number') {
      const num = Number(value);
      if (isNaN(num) && field.valCondition !== 'is_number') return 'Must be a number.';
      if (field.valCondition === 'is_number' && isNaN(num)) return err;
      if (field.valCondition === 'whole_number' && !Number.isInteger(num)) return err;
      if (field.valCondition === '>' && num <= Number(field.valNumber1)) return err;
      if (field.valCondition === '>=' && num < Number(field.valNumber1)) return err;
      if (field.valCondition === '<' && num >= Number(field.valNumber1)) return err;
      if (field.valCondition === '<=' && num > Number(field.valNumber1)) return err;
      if (field.valCondition === '==' && num !== Number(field.valNumber1)) return err;
      if (field.valCondition === '!=' && num === Number(field.valNumber1)) return err;
      if (field.valCondition === 'between' && (num < Number(field.valNumber1) || num > Number(field.valNumber2))) return err;
    }
    if (field.valType === 'text') {
      if (field.valCondition === 'contains' && !value.includes(field.valNumber1)) return err;
      if (field.valCondition === 'not_contains' && value.includes(field.valNumber1)) return err;
      if (field.valCondition === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return err;
      if (field.valCondition === 'url' && !/^https?:\/\//.test(value)) return err;
    }
    if (field.valType === 'length') {
      if (field.valCondition === 'max_char' && value.length > Number(field.valNumber1)) return err;
      if (field.valCondition === 'min_char' && value.length < Number(field.valNumber1)) return err;
    }
    if (field.valType === 'regex') {
      try {
        const re = new RegExp(field.valNumber1);
        if (field.valCondition === 'contains' && !re.test(value)) return err;
        if (field.valCondition === 'not_contains' && re.test(value)) return err;
        if (field.valCondition === 'matches' && !value.match(new RegExp(`^${field.valNumber1}$`))) return err;
        if (field.valCondition === 'not_matches' && value.match(new RegExp(`^${field.valNumber1}$`))) return err;
      } catch (e) { return 'Invalid Regex configured.'; }
    }
    return null;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    for (let field of formData.fields) {
      if (field.required) {
        if (!responses[field.id] && (!files[field.id] || files[field.id].length === 0)) {
          alert(`Please answer the required question: ${field.label}`);
          setIsSubmitting(false);
          return;
        }
      }
      if (['text', 'paragraph'].includes(field.type)) {
        const err = executeValidation(field, responses[field.id]);
        if (err) { alert(`Error in "${field.label}": ${err}`); setIsSubmitting(false); return; }
      }
    }

    const data = new FormData();
    Object.keys(responses).forEach((key) => data.append(key, responses[key]));
    
    Object.keys(files).forEach((key) => {
      files[key].forEach((file) => {
        data.append(`${key}[]`, file); 
      });
    });

    try {
      await axios.post(`${API_URL}/responses/${formId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (error) { 
      alert("Submission failed"); 
      setIsSubmitting(false);
    }
  };

  if (!formData) return <div style={{ padding: '30px', textAlign: 'center', fontSize: '18px' }}>Loading Form...</div>;
  if (submitted) return <div style={{ padding: '50px', textAlign: 'center', background: '#e2f0d9', margin: '20px', borderRadius: '8px', border: '1px solid #385723' }}><h2>Your response has been recorded.</h2></div>;

  return (
    <div style={{ padding: '20px', maxWidth: '750px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <form onSubmit={submitForm} style={{ background: 'white', padding: '40px', borderRadius: '8px', borderTop: '10px solid #673ab7', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>{formData.title}</h1>
        {formData.fields.map((field) => (
          <div key={field.id} style={{ marginBottom: '25px', padding: '20px', background: '#fff', border: '1px solid #dadce0', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '15px', fontSize: '16px', fontWeight: '500' }}>
              {field.label} {field.required && <span style={{ color: '#d93025', marginLeft: '4px' }}>*</span>}
            </label>

            {field.type === 'text' && <input type="text" onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ width: '50%', padding: '10px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none', fontSize: '14px' }} placeholder="Your answer" />}
            {field.type === 'paragraph' && <textarea onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ width: '100%', height: '80px', padding: '10px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none', resize: 'none', fontSize: '14px' }} placeholder="Your answer" />}
            {field.type === 'date' && <input type="date" onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />}
            {field.type === 'time' && <input type="time" onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />}
            
            {field.type === 'file' && (
              <div>
                <input type="file" multiple onChange={(e) => handleFileAccumulator(field.id, e.target.files, field.maxFileCount || 1, field.maxFileSize || 10)} style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '12px', color: '#666' }}>Upload up to {field.maxFileCount} files (Max {field.maxFileSize}MB each)</div>
                {files[field.id] && files[field.id].length > 0 && (
                  <ul style={{ listStyleType: 'none', padding: 0, marginTop: '10px' }}>
                    {files[field.id].map((f, idx) => (
                      <li key={idx} style={{ background: '#f1f3f4', padding: '6px 12px', borderRadius: '16px', display: 'inline-block', marginRight: '5px', marginBottom: '5px', fontSize: '13px' }}>
                        {f.name} <span onClick={() => removeFile(field.id, idx)} style={{ color: 'red', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}>✕</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {field.type === 'dropdown' && (
              <select onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ padding: '10px', width: '50%', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                <option value="">Choose</option>
                {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            )}

            {field.type === 'radio' && field.options.map((opt, i) => (
              <div key={i} style={{ margin: '10px 0' }}><label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><input type="radio" name={field.id} value={opt} onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ marginRight: '10px', transform: 'scale(1.2)' }} /> {opt}</label></div>
            ))}

            {field.type === 'checkbox' && field.options.map((opt, i) => (
              <div key={i} style={{ margin: '10px 0' }}><label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><input type="checkbox" onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)} style={{ marginRight: '10px', transform: 'scale(1.2)' }} /> {opt}</label></div>
            ))}

            {field.type === 'scale' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '60%', margin: '20px auto', textAlign: 'center' }}>
                {Array.from({ length: field.scaleMax - field.scaleMin + 1 }, (_, i) => i + field.scaleMin).map((num) => (
                  <label key={num} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                    <span style={{ marginBottom: '8px', fontSize: '14px' }}>{num}</span>
                    <input type="radio" name={field.id} value={num} onChange={(e) => handleSimpleChange(field.id, e.target.value)} style={{ transform: 'scale(1.3)' }} />
                  </label>
                ))}
              </div>
            )}

            {['grid-radio', 'grid-checkbox'].includes(field.type) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '400px' }}>
                  <thead>
                    <tr>
                      <th></th>
                      {field.columns.map((col, cIdx) => <th key={cIdx} style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: '#5f6368' }}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {field.rows.map((row, rIdx) => (
                      <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#f8f9fa' : 'white' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{row}</td>
                        {field.columns.map((col, cIdx) => (
                          <td key={cIdx} style={{ padding: '12px', textAlign: 'center' }}>
                            <input type={field.type === 'grid-radio' ? 'radio' : 'checkbox'} name={`${field.id}-${row}`} onChange={(e) => handleGridChange(field.id, row, col, field.type === 'grid-checkbox')} style={{ transform: 'scale(1.2)' }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        <button type="submit" disabled={isSubmitting} style={{ background: isSubmitting ? '#ccc' : '#673ab7', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

function ResponseDashboard() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mailModalActive, setMailModalActive] = useState(false);
  const [activeResp, setActiveResp] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [previewTab, setPreviewTab] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [selectedFieldsForMail, setSelectedFieldsForMail] = useState([]);
  const [mailFileMode, setMailFileMode] = useState('link');

  useEffect(() => { fetchData(); }, [formId]);

  const fetchData = async () => {
    try {
      const [formRes, respRes] = await Promise.all([
        axios.get(`${API_URL}/forms/${formId}`),
        axios.get(`${API_URL}/responses/${formId}`)
      ]);
      setForm(formRes.data);
      setResponses(respRes.data);
    } catch (error) { alert("Error fetching dashboard data"); } finally { setLoading(false); }
  };

  const deleteSingleResponse = async (responseId) => {
    if (window.confirm('Are you sure you want to delete this specific response?')) {
      try {
        await axios.delete(`${API_URL}/responses/${formId}/${responseId}`);
        setResponses(responses.filter(r => r.responseId !== responseId));
      } catch (error) { alert('Failed to delete response.'); }
    }
  };

  const deleteAllResponses = async () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL responses for this form? This cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/responses/bulk/${formId}`);
        setResponses([]);
      } catch (error) { alert('Failed to delete responses.'); }
    }
  };

  const exportToExcelCSV = () => {
    if (!form || responses.length === 0) return;
    const headers = ['Submission Time', ...form.fields.map(f => f.label || 'Untitled Question')];
    const rows = responses.map(resp => {
      return [
        new Date(resp.submittedAt).toLocaleString(),
        ...form.fields.map(field => {
          const ans = resp.answers[field.id];
          if (!ans) return '';
          if (Array.isArray(ans)) {
            return ans.map((url, idx) => `=HYPERLINK(""${url}"", ""File ${idx + 1}"")`).join(' | ');
          }
          if (typeof ans === 'string' && ans.startsWith('http')) {
             return `=HYPERLINK(""${ans}"", ""View File"")`;
          }
          return String(ans).replace(/"/g, '""');
        })
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${form.title.replace(/\s+/g, '_')}_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openMailModal = (resp) => {
    setActiveResp(resp);
    setEmailTo('');
    setEmailSubject(`Update: ${form.title}`);
    const defaultFields = form.fields.map(f => f.id);
    setSelectedFieldsForMail(defaultFields);
    setMailFileMode('link');
    generateTemplate(defaultFields, 'link');
    setPreviewTab(false);
    setMailModalActive(true);
  };

  const generateTemplate = (fieldsArray, fMode) => {
    let defaultBody = `<h3>Form Response Data</h3><p>Thank you for submitting.</p><ul>`;
    form.fields.forEach(f => {
      if (fieldsArray.includes(f.id)) {
        if (f.type === 'file' && fMode === 'attach') {
          defaultBody += `<li><strong>${f.label}:</strong> [Files Attached to Email]</li>`;
        } else {
          defaultBody += `<li><strong>${f.label}:</strong> {{${f.id}}}</li>`;
        }
      }
    });
    defaultBody += `</ul>`;
    setEmailTemplate(defaultBody);
  };

  const toggleFieldForMail = (fieldId) => {
    let newFields = [...selectedFieldsForMail];
    if (newFields.includes(fieldId)) newFields = newFields.filter(id => id !== fieldId);
    else newFields.push(fieldId);
    setSelectedFieldsForMail(newFields);
    generateTemplate(newFields, mailFileMode);
  };

  const toggleFileMode = (mode) => {
    setMailFileMode(mode);
    generateTemplate(selectedFieldsForMail, mode);
  };

  const parseMailTemplate = (templateStr, resp) => {
    if (!resp) return '';
    let parsed = templateStr;
    parsed = parsed.split('{{Timestamp}}').join(new Date(resp.submittedAt).toLocaleString());
    form.fields.forEach(f => {
      const ans = resp.answers[f.id];
      let txt = '-';
      if (ans) {
        if (Array.isArray(ans)) txt = ans.map((l, i) => `<a href="${l}">File ${i + 1}</a>`).join(', ');
        else if (typeof ans === 'string' && ans.startsWith('http')) txt = `<a href="${ans}">View File</a>`;
        else txt = ans.toString();
      }
      parsed = parsed.split(`{{${f.id}}}`).join(txt);
    });
    return parsed;
  };

  const sendCustomMail = async () => {
    if (!emailTo) { alert('Recipient email address is required.'); return; }
    setSendingMail(true);
    const dynamicHTML = parseMailTemplate(emailTemplate, activeResp);
    
    let attachments = [];
    if (mailFileMode === 'attach') {
      form.fields.forEach(f => {
        if (f.type === 'file' && selectedFieldsForMail.includes(f.id) && activeResp.answers[f.id]) {
          const links = Array.isArray(activeResp.answers[f.id]) ? activeResp.answers[f.id] : [activeResp.answers[f.id]];
          links.forEach((link, idx) => {
            attachments.push({
              filename: `${f.label.replace(/\s+/g, '_')}_${idx + 1}`,
              path: link
            });
          });
        }
      });
    }

    try {
      await axios.post(`${API_URL}/responses/send-email`, {
        to: emailTo,
        subject: emailSubject,
        html: dynamicHTML,
        attachments
      });
      alert('Mail dispatched successfully!');
      setMailModalActive(false);
    } catch (e) {
      alert('Failed to send mail. Check your backend SMTP config.');
    } finally {
      setSendingMail(false);
    }
  };

  const renderHorizontalAnswer = (ans) => {
    if (!ans) return '';
    if (Array.isArray(ans)) {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ans.map((item, idx) => (
            <React.Fragment key={idx}>
              {typeof item === 'string' && item.startsWith('http') ? (
                <a href={item} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none', background: '#e8f0fe', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  📄 File {idx + 1}
                </a>
              ) : (
                item
              )}
              {idx < ans.length - 1 ? <span style={{ color: '#ccc' }}>|</span> : ''}
            </React.Fragment>
          ))}
        </div>
      );
    }
    if (typeof ans === 'string' && ans.startsWith('http')) return <a href={ans} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8' }}>📄 File 1</a>;
    if (typeof ans === 'string' && (ans.startsWith('{') || ans.startsWith('['))) {
      try {
        const parsed = JSON.parse(ans);
        if (Array.isArray(parsed)) return parsed.join(', ');
        if (typeof parsed === 'object') return Object.entries(parsed).map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
      } catch (e) {}
    }
    return ans.toString();
  };

  if (loading) return <div style={{ padding: '30px', textAlign: 'center' }}>Loading Dashboard...</div>;
  if (!form) return <div style={{ padding: '30px', textAlign: 'center' }}>Form not found!</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Admin Panel</Link>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2>{form.title} - Responses ({responses.length})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {responses.length > 0 && (
              <>
                <button onClick={exportToExcelCSV} style={{ background: '#28a745', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📥 Export To Excel
                </button>
                <button onClick={deleteAllResponses} style={{ background: '#dc3545', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑 Delete All
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '900px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f3f4', borderBottom: '2px solid #bdc1c6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid #dadce0', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#f1f3f4', zIndex: 1 }}>Timestamp</th>
                {form.fields.map((field) => (
                  <th key={field.id} style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid #dadce0', minWidth: '150px' }}>
                    {field.label || 'Untitled Question'}
                  </th>
                ))}
                <th style={{ padding: '12px', textAlign: 'center', minWidth: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.length === 0 ? (
                <tr><td colSpan={form.fields.length + 2} style={{ padding: '20px', textAlign: 'center' }}>No responses yet.</td></tr>
              ) : (
                responses.map((resp) => (
                  <tr key={resp.responseId} style={{ borderBottom: '1px solid #e8eaed' }}>
                    <td style={{ padding: '12px', borderRight: '1px solid #dadce0', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>
                      {new Date(resp.submittedAt).toLocaleString()}
                    </td>
                    {form.fields.map((field) => (
                      <td key={field.id} style={{ padding: '12px', borderRight: '1px solid #dadce0' }}>
                        {renderHorizontalAnswer(resp.answers[field.id]) || <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                    ))}
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => openMailModal(resp)} style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📧 Send Mail</button>
                      <button onClick={() => deleteSingleResponse(resp.responseId)} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mailModalActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2>Configure Email Response</h2>
              <button onClick={() => setMailModalActive(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <h4>Select Questions to Include</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                  {form.fields.map(f => (
                    <label key={f.id} style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedFieldsForMail.includes(f.id)} onChange={() => toggleFieldForMail(f.id)} style={{ marginRight: '8px' }} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <h4>File Handling</h4>
                <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="fileMode" checked={mailFileMode === 'link'} onChange={() => toggleFileMode('link')} style={{ marginRight: '8px' }} />
                  Show URLs in Body
                </label>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="radio" name="fileMode" checked={mailFileMode === 'attach'} onChange={() => toggleFileMode('attach')} style={{ marginRight: '8px' }} />
                  Attach Files Directly
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Recipient Email (To):</label>
              <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="user@example.com" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email Subject:</label>
              <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '15px' }}>
              <button onClick={() => setPreviewTab(false)} style={{ padding: '8px 16px', background: !previewTab ? '#fff' : '#eee', border: '1px solid #ccc', borderBottom: !previewTab ? 'none' : '1px solid #ccc', cursor: 'pointer' }}>HTML Script Editor</button>
              <button onClick={() => setPreviewTab(true)} style={{ padding: '8px 16px', background: previewTab ? '#fff' : '#eee', border: '1px solid #ccc', borderBottom: previewTab ? 'none' : '1px solid #ccc', cursor: 'pointer' }}>Live Preview</button>
            </div>

            {!previewTab ? (
              <textarea value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} style={{ width: '100%', height: '180px', padding: '10px', boxSizing: 'border-box', fontFamily: 'monospace', border: '1px solid #ccc', borderRadius: '4px' }} />
            ) : (
              <div style={{ border: '1px solid #ccc', padding: '15px', minHeight: '180px', borderRadius: '4px', background: '#fff' }}>
                <div dangerouslySetInnerHTML={{ __html: parseMailTemplate(emailTemplate, activeResp) }} />
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => setMailModalActive(false)} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Cancel</button>
              <button onClick={sendCustomMail} disabled={sendingMail} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: sendingMail ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {sendingMail ? 'Dispatching Mail...' : 'Execute & Send Mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '10px 0' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/create" element={<FormBuilder />} />
          <Route path="/edit/:formId" element={<FormBuilder />} />
          <Route path="/form/:formId" element={<FormViewer />} />
          <Route path="/responses/:formId" element={<ResponseDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;