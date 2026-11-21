import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Role, SUPER_ADMIN_REPORTS, SuperAdminReport } from '@multispeciality-hms/contracts';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { buildCsvContent, downloadCsvFile, downloadPdfFile, openPrintableReport } from '../services/downloadHelper';

type Row = Record<string, unknown>;
type Field = readonly [key: string, label: string, optional?: boolean];
const branchFields: Field[] = [
  ['name','Branch name'], ['code','Code'], ['city','City'], ['address','Address'], ['phone','Phone'],
  ['type','Branch type',true], ['description','Description',true], ['contactPerson','Contact person',true],
  ['email','Email',true], ['alternatePhone','Alternate phone',true], ['addressLine2','Address line 2',true],
  ['district','District',true], ['state','State',true], ['country','Country',true], ['pincode','Postal code',true],
  ['registrationNumber','Registration number',true], ['licenseNumber','License number',true],
  ['gstNumber','GST number',true], ['openingDate','Opening date (YYYY-MM-DD)',true], ['workingHours','Working hours',true],
];
const organizationFields: Field[] = [
  ['name','Name'], ['tamilName','Tamil name',true], ['licenseNumber','License number'], ['addressLine1','Address'],
  ['addressLine2','Address line 2',true], ['city','City'], ['state','State'], ['postalCode','Postal code'],
  ['country','Country'], ['phone','Phone'], ['email','Email'], ['emergencyPhone','Emergency phone',true], ['website','Website',true],
];
const staffFields: Field[] = [['firstName','First name'], ['lastName','Last name'], ['employeeCode','Employee code']];
const departmentFields: Field[] = [['name','Department name'], ['code','Code'], ['description','Description',true], ['branchId','Branch',true]];
const lists: Record<string,string> = { branches:'Branches', admins:'Administrators', users:'Users', departments:'Clinical Departments', doctors:'Doctors', patients:'Patients', 'audit-logs':'Audit Logs', notifications:'Notifications', 'master-settings':'Master Settings' };
const req = mobileApiClient.superAdmin.request;
const message = (error: unknown) => error instanceof Error ? error.message : 'The request could not be completed.';
const label = (row: Row) => {
  const staff = (row.employee as { user?: Row } | undefined)?.user ?? row;
  return String(row.name ?? row.title ?? ([staff.firstName,staff.lastName].filter(Boolean).join(' ') || row.action || row.code || row.id));
};
const idOf = (row: Row) => String(row.id);
const segment = (id: string) => encodeURIComponent(id);
const display = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(display).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.entries(value).filter(([key]) => key !== 'id').map(([key,item]) => display(item) ? key + ' ' + display(item) : '').filter(Boolean).join(', ');
  return String(value);
};

function Button({title, onPress, disabled = false}: {title: string; onPress: () => void; disabled?: boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

function useLoad<T>(load: () => Promise<T>, dependencies: string) {
  const [state,setState] = useState<{value?: T; error?: string}>({});
  const [version,refresh] = useState(0);
  useEffect(() => {
    let current = true;
    setState({});
    load().then(value => { if (current) setState({value}); }, error => { if (current) setState({error:message(error)}); });
    return () => { current = false; };
  // The caller supplies a key for every input read by load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[dependencies, version]);
  return {...state, reload: () => refresh(n => n + 1)};
}

function Notice({error}: {error?: string}) {
  return <Text accessibilityLiveRegion="polite" style={error ? styles.error : styles.muted}>{error || 'Loading…'}</Text>;
}
function Card({row}: {row: Row}) {
  return <View style={styles.card}>{Object.entries(row).filter(([key]) => !['id','hospitalId','branchId','departmentId','userId'].includes(key)).map(([key,value]) => display(value) ? <Text key={key} style={styles.value}>{key.replace(/([a-z])([A-Z])/g,'$1 $2')}: {display(value)}</Text> : null)}</View>;
}
function Choices({options, value, onChange}: {options: [string,string][]; value: string; onChange: (value: string) => void}) {
  return <View style={styles.actions}>{options.map(([id,name]) => <Pressable key={id} accessibilityRole="button" accessibilityState={{selected:value===id}} onPress={() => onChange(id)} style={[styles.choice,value===id && styles.selected]}><Text>{name}</Text></Pressable>)}</View>;
}
function Input({label: title, value, change}: {label: string; value: string; change: (value: string) => void}) {
  return <View><Text style={styles.value}>{title}</Text><TextInput accessibilityLabel={title} value={value} onChangeText={change} autoCapitalize="none" style={styles.input}/></View>;
}

const branchOptions = async () => {
  const options: [string,string][] = [];
  let totalPages = 1;
  for (let page=1; page<=totalPages; page++) {
    const response = await req<Row[]>('branches','GET',undefined,{status:'ACTIVE',limit:100,page});
    options.push(...(response.data ?? []).map((row): [string,string] => [idOf(row),label(row)]));
    totalPages = response.meta?.totalPages ?? 1;
  }
  return options;
};

function Editor({fields, initial, onSave, choices = {}, activeControl = false}: {
  fields: Field[]; initial?: Row; onSave: (data: Record<string,string | boolean | null>) => Promise<void>;
  choices?: Record<string,[string,string][]>; activeControl?: boolean;
}) {
  const [values,setValues] = useState<Record<string,string>>(() => Object.fromEntries(fields.map(([key]) => [key, String(initial?.[key] ?? '').slice(0, key==='openingDate' ? 10 : undefined)])));
  const [active,setActive] = useState(initial?.isActive !== false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const change = (key: string, value: string) => setValues(old => ({...old,[key]:value}));
  async function save() {
    setError('');
    const missing = fields.find(([key,,optional]) => !optional && !values[key]?.trim());
    if (missing) { setError('Enter ' + missing[1].toLowerCase() + '.'); return; }
    const data: Record<string,string | boolean | null> = {};
    for (const [key,,optional] of fields) {
      const value = values[key]?.trim();
      if (value || !optional) data[key] = value ?? '';
      else if (key === 'branchId' && initial) data[key] = null;
      else if (initial && !['email','alternatePhone','emergencyPhone','pincode','openingDate'].includes(key)) data[key] = '';
    }
    if (activeControl) data.isActive = active;
    setBusy(true);
    try { await onSave(data); } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <View style={styles.card}>
    {fields.map(([key,title,optional]) => choices[key] ? <View key={key}><Text style={styles.value}>{title}</Text><Choices options={[...(optional ? [['','None'] as [string,string]] : []),...choices[key]]} value={values[key] ?? ''} onChange={value => change(key,value)}/></View> :
      <Input key={key} label={title + (optional ? '' : ' *')} value={values[key] ?? ''} change={value => change(key,value)}/>)}
    {activeControl && <Choices options={[[ 'active','Active'],['inactive','Inactive']]} value={active ? 'active' : 'inactive'} onChange={value => setActive(value === 'active')}/>}
    {!!error && <Notice error={error}/>}
    <Button title={busy ? 'Saving…' : 'Save'} disabled={busy} onPress={save}/>
  </View>;
}

function useAction() {
  const [state,setState] = useState({busy:false,feedback:'',error:false});
  const [confirmation,setConfirmation] = useState<{title:string; action:() => Promise<void>}>();
  return { ...state, confirmation, cancel: () => setConfirmation(undefined),
    confirm: (title: string, action: () => Promise<void>) => setConfirmation({title,action}),
    run: async (action: () => Promise<void>) => {
      setConfirmation(undefined);
      setState({busy:true,feedback:'',error:false});
      try { await action(); setState({busy:false,feedback:'Saved.',error:false}); }
      catch (error) { setState({busy:false,feedback:message(error),error:true}); }
    },
  };
}

function Feedback({action}: {action: ReturnType<typeof useAction>}) {
  return <>{!!action.feedback && <Text accessibilityLiveRegion="polite" style={action.error ? styles.error : styles.value}>{action.feedback}</Text>}{action.confirmation && <View style={styles.card}><Text>{action.confirmation.title}</Text><View style={styles.actions}><Button title="Confirm" disabled={action.busy} onPress={() => { const pending = action.confirmation; if (pending) void action.run(pending.action); }}/><Button title="Cancel" onPress={action.cancel}/></View></View>}</>;
}

function Directory({section, navigate}: {section: string; navigate: Navigate}) {
  const [draft,setDraft] = useState('');
  const [search,setSearch] = useState('');
  const [resource,setResource] = useState('');
  const [resourceFilter,setResourceFilter] = useState('');
  const [status,setStatus] = useState('');
  const [scope,setScope] = useState('');
  const [sortOrder,setSortOrder] = useState('asc');
  const [role,setRole] = useState('');
  const [page,setPage] = useState(1);
  const [editing,setEditing] = useState<Row>();
  const action = useAction();
  const branches = useLoad(async () => ['branches','admins','users','departments','doctors','patients'].includes(section) ? branchOptions() : [], section);
  const unpaged = ['notifications','master-settings'].includes(section);
  const data = useLoad(async () => {
    const params = {page,search:search || undefined,status:status || undefined,limit:20,branchIds:scope || undefined,sortOrder,role:role || undefined};
    if (section === 'audit-logs') return mobileApiClient.superAdmin.audit({ page,limit:20,action:search || undefined,resource:resourceFilter || undefined,sortOrder });
    if (section === 'notifications') return mobileApiClient.notifications.getNotifications();
    return req<Row[]>(section === 'master-settings' ? 'master-items' : section,'GET',undefined,unpaged ? undefined : params);
  }, JSON.stringify([section,page,search,status,scope,sortOrder,resourceFilter,role]));
  const rows: Row[] = data.value?.data ?? [];
  const max = data.value?.meta?.totalPages ?? 1;

  const handleExport = async (format: 'csv' | 'pdf' | 'print') => {
    action.run(async () => {
      const exportParams = { page: 1, limit: 1000, search: search || undefined, status: status || undefined, branchIds: scope || undefined, sortOrder, role: role || undefined };
      let allRows: Row[] = [];
      if (section === 'audit-logs') {
        const res = await mobileApiClient.superAdmin.audit({ page: 1, limit: 1000, action: search || undefined, resource: resourceFilter || undefined, sortOrder });
        allRows = (res as any)?.data ?? [];
      } else {
        const res = await req<Row[]>(section === 'master-settings' ? 'master-items' : section, 'GET', undefined, exportParams);
        allRows = res?.data ?? [];
      }
      if (!allRows.length) throw new Error('No records found to export.');

      let headers: string[] = [];
      let exportData: (string | number | boolean | null | undefined)[][] = [];
      const title = titles[section] || section;

      if (section === 'doctors') {
        headers = ['Doctor Name', 'Code/License', 'Department', 'Specialization', 'Branch', 'OPD Fee', 'Shift', 'Availability'];
        exportData = allRows.map((r: any) => {
          const staff = r.employee?.user ?? r;
          return [
            `Dr. ${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            r.licenseNumber || r.doctorCode || '-',
            r.department?.name || r.department || '-',
            r.specialization || '-',
            r.branch?.name || r.branchName || '-',
            r.consultationFee ? `₹${r.consultationFee}` : '-',
            r.shift || '-',
            r.isAvailableToday ? 'Available' : 'Unavailable',
          ];
        });
      } else if (section === 'patients') {
        headers = ['UHID', 'Patient Name', 'Gender', 'Phone', 'City', 'Status', 'Registered Date'];
        exportData = allRows.map((r: any) => [
          r.uhid || '-',
          `${r.firstName || ''} ${r.lastName || ''}`.trim(),
          r.gender || '-',
          r.phone || '-',
          r.city || '-',
          r.status || 'ACTIVE',
          r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-',
        ]);
      } else if (section === 'audit-logs') {
        headers = ['Timestamp', 'User Email', 'Role', 'Action', 'Resource', 'Resource ID', 'Scope'];
        exportData = allRows.map((r: any) => [
          r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
          r.userEmail || '-',
          r.userRole || '-',
          r.action || '-',
          r.resource || '-',
          r.resourceId || '-',
          r.branchId || r.hospitalId || '-',
        ]);
      } else if (section === 'branches') {
        headers = ['Code', 'Branch Name', 'City', 'Phone', 'Status'];
        exportData = allRows.map((r: any) => [
          r.code || '-',
          r.name || '-',
          r.city || '-',
          r.phone || '-',
          r.isActive ? 'Active' : 'Inactive',
        ]);
      } else if (section === 'admins' || section === 'users') {
        headers = ['Name', 'Email', 'Role', 'Employee Code', 'Status'];
        exportData = allRows.map((r: any) => {
          const emp = r.employee as any;
          const roleStr = Array.isArray(r.roles) ? r.roles.map((x: any) => x.role?.name || x.role || x).join(', ') : (r.role || '-');
          return [
            `${r.firstName || ''} ${r.lastName || ''}`.trim(),
            r.email || '-',
            roleStr,
            emp?.employeeCode || '-',
            r.isActive ? 'Active' : 'Inactive',
          ];
        });
      } else {
        const keys = Object.keys(allRows[0] || {}).filter(k => !['id', 'hospitalId'].includes(k));
        headers = keys.map(k => k.replace(/([a-z])([A-Z])/g, '$1 $2'));
        exportData = allRows.map(r => keys.map(k => display(r[k])));
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = buildCsvContent(headers, exportData);
        downloadCsvFile(`${section}-export-${timestamp}`, csv);
      } else if (format === 'pdf') {
        downloadPdfFile(`${section}-export-${timestamp}`, title, `Exported on ${new Date().toLocaleDateString()}`, headers, exportData);
      } else if (format === 'print') {
        openPrintableReport(title, `Exported on ${new Date().toLocaleDateString()}`, headers, exportData);
      }
    });
  };

  const open = (row: Row) => {
    if (section === 'branches') navigate('branch-details',idOf(row));
    else if (section === 'admins' || section === 'users') navigate('admin-details',idOf(row));
    else setEditing(row);
  };
  return <>
    {!unpaged && <View style={styles.card}>
      <Input label={section==='audit-logs' ? 'Action filter' : 'Search'} value={draft} change={setDraft}/>
      {section==='audit-logs' && <Input label="Resource filter" value={resource} change={setResource}/>}
      <View style={styles.actions}><Button title="Apply filters" onPress={() => {setSearch(draft.trim());setResourceFilter(resource.trim());setPage(1);}}/>
      <Button title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'} onPress={() => {setSortOrder(sortOrder==='asc'?'desc':'asc');setPage(1);}}/></View>
      {['branches','admins','users','departments','doctors'].includes(section) && <Choices options={[[ '', 'All statuses'],['ACTIVE','Active'],['INACTIVE','Inactive']]} value={status} onChange={value => {setStatus(value);setPage(1);}}/>}
      {section === 'patients' && <Choices options={[[ '', 'All statuses'],['ADMITTED','Admitted'],['DISCHARGED','Discharged'],['OUTPATIENT','Outpatient']]} value={status} onChange={value => {setStatus(value);setPage(1);}}/>}
      {['users','admins'].includes(section) && <Choices options={[[ '', 'All roles'], ...(section==='admins' ? [Role.HOSPITAL_ADMIN,Role.DEPARTMENT_ADMIN] : Object.values(Role)).map((value): [string,string] => [value,value.replace(/_/g,' ')])]} value={role} onChange={value => {setRole(value);setPage(1);}}/>}
      {!!branches.value?.length && <Choices options={[[ '', 'All branches'],...branches.value]} value={scope} onChange={value => {setScope(value);setPage(1);}}/>}
    </View>}
    <View style={styles.actions}>
      <Button title="Refresh" onPress={data.reload}/>
      {['doctors','patients','audit-logs','branches','admins','users'].includes(section) && <>
        <Button title="Export CSV" disabled={action.busy} onPress={() => handleExport('csv')}/>
        <Button title="Export PDF" disabled={action.busy} onPress={() => handleExport('pdf')}/>
        <Button title="Print" disabled={action.busy} onPress={() => handleExport('print')}/>
      </>}
      {section === 'branches' && <Button title="Add branch" onPress={() => navigate('add-branch')}/>}
      {section === 'admins' && <Button title="Create administrator" onPress={() => navigate('create-admin')}/>}
      {['departments','master-settings'].includes(section) && <Button title="Add item" onPress={() => setEditing({})}/>}
      {section==='notifications' && <Button title="Mark all as read" disabled={action.busy} onPress={() => action.run(async () => {await mobileApiClient.notifications.markAllAsRead();data.reload();})}/>}
    </View>
    <Feedback action={action}/>
    {editing && <><Button title="Close details" onPress={() => setEditing(undefined)}/>
      {section === 'departments' && branches.value ? <Editor key={idOf(editing)} fields={departmentFields} initial={editing.id ? editing : undefined} choices={{branchId:branches.value}} onSave={async body => {await req('departments' + (editing.id ? '/' + segment(idOf(editing)) : ''),editing.id?'PATCH':'POST',body);setEditing(undefined);data.reload();}}/> :
      section === 'master-settings' ? <Editor key={idOf(editing)} fields={[[ 'category','Category'],['code','Code'],['name','Name'],['description','Description',true]]}
        initial={editing.id ? {...editing,category:(editing.dataSet as Row | undefined)?.key} : undefined}
        choices={{category:(editing.id ? [String((editing.dataSet as Row | undefined)?.key)] : ['Department','Specialization','Designation']).map(name => [name,name])}}
        onSave={async body => {await req(editing.id ? 'master-items/'+segment(idOf(editing)) : 'master-items',editing.id?'PATCH':'POST',body);setEditing(undefined);data.reload();}}/> :
      <Card row={editing}/>}
    </>}
    {!data.value ? <Notice error={data.error}/> : rows.length === 0 ? <Text style={styles.muted}>No records found.</Text> : rows.map(row => <View key={idOf(row)} style={styles.card}>
      <Text style={styles.heading}>{label(row)}</Text><Text style={styles.muted}>{display(row.code ?? row.email ?? row.createdAt ?? row.status)}</Text>
      <View style={styles.actions}>
        <Button title="View details" onPress={() => open(row)}/>
        {['departments','master-settings'].includes(section) && <Button title={(row.isActive ?? row.status === 'ACTIVE') ? 'Deactivate' : 'Activate'} disabled={action.busy} onPress={() => action.confirm('Change the status of ' + label(row) + '?', async () => {
          await req((section==='departments' ? section : 'master-items') + '/' + segment(idOf(row)) + '/status','PATCH',{isActive:!(row.isActive ?? row.status === 'ACTIVE')});setEditing(undefined);data.reload();
        })}/>}
        {section==='notifications' && row.isRead === false && <Button title="Mark as read" disabled={action.busy} onPress={() => action.run(async () => {await mobileApiClient.notifications.markAsRead(idOf(row));data.reload();})}/>}
      </View>
    </View>)}
    {!unpaged && <View style={styles.actions}><Button title="Previous" disabled={page<=1} onPress={() => setPage(page-1)}/><Text style={styles.value}>Page {page} of {Math.max(max,1)}</Text><Button title="Next" disabled={page>=max} onPress={() => setPage(page+1)}/></View>}
  </>;
}

type Navigate = (screen: string, id?: string, branchId?: string) => void;
function Branch({section,id,navigate}: {section: string; id: string; navigate: Navigate}) {
  const data = useLoad(async () => id ? (await req<Row>('branches/'+segment(id))).data : undefined, id);
  const action = useAction();
  if (section==='add-branch' || section==='edit-branch') {
    if (section==='edit-branch' && !data.value) return <Notice error={data.error || (!id ? 'Select a branch first.' : undefined)}/>;
    return <Editor fields={branchFields} initial={data.value} activeControl={section==='add-branch'} onSave={async body => {
      const saved = await req<Row>(id?'branches/'+segment(id):'branches',id?'PATCH':'POST',body);
      navigate('branch-details',String(saved.data?.id ?? id));
    }}/>;
  }
  const row = data.value;
  if (!row) return <Notice error={data.error || (!id ? 'Select a branch first.' : undefined)}/>;
  return <><Card row={row}/><View style={styles.actions}><Button title="Edit branch" onPress={() => navigate('edit-branch',id)}/>
    {row.isActive === true && <Button title="Assign administrator" onPress={() => navigate('assign-admin',undefined,id)}/>}
    <Button title={row.isActive ? 'Deactivate branch' : 'Activate branch'} disabled={action.busy} onPress={() => action.confirm('Change branch status?',async () => {
      await req('branches/'+segment(id)+'/status','PATCH',{isActive:!row.isActive});data.reload();
    })}/></View><Feedback action={action}/></>;
}

function Organization() {
  const data = useLoad(async () => (await req<Row>('organization')).data ?? {},'organization');
  const [saved,setSaved] = useState(false);
  return data.value ? <><Text style={styles.value}>Hospital code {display(data.value.code)}</Text>
    <Editor fields={organizationFields} initial={data.value} onSave={async body => {await req('organization','PATCH',body);setSaved(true);data.reload();}}/>
    {saved && <Text accessibilityLiveRegion="polite">Organization profile saved.</Text>}</> : <Notice error={data.error}/>;
}

function Administrator({section,id,branchId,navigate}: {section:string; id:string; branchId:string; navigate:Navigate}) {
  const account = useLoad(async () => id ? (await req<Row>('users/'+segment(id))).data : undefined,id);
  const needsBranch = section !== 'admin-details';
  const branches = useLoad(async () => needsBranch ? branchOptions() : [],section);
  const departments = useLoad(async () => {
    const options: [string,string][] = [];
    if (section !== 'create-admin') return options;
    let totalPages = 1;
    for (let page=1; page<=totalPages; page++) {
      const response = await req<Row[]>('departments','GET',undefined,{status:'ACTIVE',limit:100,page});
      options.push(...(response.data ?? []).map((row): [string,string] => [idOf(row), label(row) + (row.branch ? ' · ' + display(row.branch) : '')]));
      totalPages = response.meta?.totalPages ?? 1;
    }
    return options;
  }, section);
  const [code,setCode] = useState<unknown>();
  const [edit,setEdit] = useState(false);
  const action = useAction();
  const candidates = useLoad(async () => {
    const options: [string,string][] = [];
    if (!branchId || id || section !== 'assign-admin') return options;
    let totalPages = 1;
    for (let page=1; page<=totalPages; page++) {
      const response = await req<Row[]>('admins','GET',undefined,{status:'ACTIVE',role:Role.HOSPITAL_ADMIN,limit:100,page});
      options.push(...(response.data ?? []).map((row): [string,string] => [idOf(row),label(row)]));
      totalPages = response.meta?.totalPages ?? 1;
    }
    return options;
  }, JSON.stringify([section,id,branchId]));
  const row = account.value;
  if (section === 'create-admin') {
    if (code) return <><Text style={styles.heading}>Administrator created</Text><Text style={styles.value}>Share this one-time invitation securely. It is shown only here.</Text><Text selectable style={styles.value}>{display(code)}</Text><Button title="Back to administrators" onPress={() => navigate('admins')}/></>;
    if (!branches.value || !departments.value) return <Notice error={branches.error || departments.error}/>;
    return <Editor fields={[...staffFields,['email','Email'],['phone','Phone'],['dateOfJoining','Joining date (YYYY-MM-DD)'],['role','Role'],['branchId','Branch',true],['departmentId','Department',true]]}
      choices={{role:[[Role.HOSPITAL_ADMIN,'Hospital Admin'],[Role.DEPARTMENT_ADMIN,'Department Admin']],branchId:branches.value,departmentId:departments.value}}
      onSave={async body => { const result = await req<Row>('admins','POST',body);setCode(result.data?.invitation); }}/>;
  }
  if (section === 'assign-admin' && branchId && !id) {
    if (!candidates.value) return <Notice error={candidates.error}/>;
    if (!candidates.value.length) return <Text style={styles.muted}>No active Hospital Admin accounts are available.</Text>;
    return <Editor fields={[[ 'userId','Hospital Admin']]} choices={{userId:candidates.value}} onSave={async body => {
      await req('users/'+segment(String(body.userId))+'/branch-assignment','PATCH',{branchId});
      navigate('branch-details',branchId);
    }}/>;
  }
  if (!row || !branches.value) return <Notice error={account.error || branches.error || (!id ? 'Select an account first.' : undefined)}/>;
  if (section === 'assign-admin') return <Editor fields={[[ 'branchId','Branch']]} initial={row} choices={{branchId:branches.value}} onSave={async body => {
    await req('users/'+segment(id)+'/branch-assignment','PATCH',body);navigate('admin-details',id);
  }}/>;
  const roleDetails = JSON.stringify(row.roles ?? row.role ?? '');
  const protectedAccount = roleDetails.includes(Role.SUPER_ADMIN);
  return <><Card row={row}/>{!protectedAccount && <View style={styles.actions}>
    <Button title={row.isActive ? 'Deactivate account' : 'Activate account'} disabled={action.busy} onPress={() => action.confirm('Change account status?',async () => {
      await req('users/'+segment(id)+'/status','PATCH',{isActive:!row.isActive});setCode(undefined);account.reload();
    })}/>
    {roleDetails.includes(Role.HOSPITAL_ADMIN) && <Button title="Assign branch" onPress={() => navigate('assign-admin',id)}/>}
    {!!row.employee && <Button title={edit?'Cancel edit':'Edit employee'} onPress={() => setEdit(!edit)}/>}
    {row.isActive === true && ['invitation','reset'].map(purpose => <Button key={purpose} title={'Issue '+purpose+' code'} disabled={action.busy} onPress={() => action.confirm('Issue a new one-time '+purpose+' code?',async () => {
      setCode(undefined);const result = await req('users/'+segment(id)+'/'+purpose+'-code','POST');setCode(result.data);
    })}/>)}
  </View>}
  {edit && <Editor fields={[...staffFields,['designation','Designation']]} initial={{...row,...row.employee as Row}} onSave={async body => {await req('users/'+segment(id)+'/employee','PATCH',body);setEdit(false);account.reload();}}/>}
  {!!code && <View style={styles.card}><Text>Share this one-time code securely.</Text><Text selectable>{display(code)}</Text><Button title="Hide code" onPress={() => setCode(undefined)}/></View>}
  <Feedback action={action}/></>;
}

function Policies() {
  const [role,setRole] = useState<string>(Role.HOSPITAL_ADMIN);
  const [grants,setGrants] = useState<string[]>();
  const policy = useLoad(async () => (await req<{defaults:string[];grants:string[]}>('policies/'+segment(role))).data ?? {defaults:[],grants:[]},role);
  const action = useAction();
  const selected = grants ?? policy.value?.grants ?? [];
  return <><Choices options={Object.values(Role).map(value => [value,value.replace(/_/g,' ')])} value={role} onChange={value => {setGrants(undefined);setRole(value);}}/>
    {!policy.value ? <Notice error={policy.error}/> : <View style={styles.card}><Text>Hospital grants are limited to those approved for each role.</Text>
      {policy.value.defaults.map(grant => <Pressable key={grant} accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(grant),disabled:role===Role.SUPER_ADMIN}} disabled={role===Role.SUPER_ADMIN || action.busy} onPress={() => setGrants(selected.includes(grant) ? selected.filter(value => value!==grant) : [...selected,grant])}>
        <Text style={styles.value}>{selected.includes(grant) ? '✓ ' : '○ '}{grant}</Text>
      </Pressable>)}
      {role !== Role.SUPER_ADMIN && <Button title="Save grants" disabled={!grants || action.busy} onPress={() => action.confirm('Apply these hospital role grants?',async () => {await req('policies/'+segment(role),'PATCH',{grants:selected});setGrants(undefined);policy.reload();})}/>}
    </View>}<Feedback action={action}/></>;
}

function csvCell(value: string | number | null) {
  let text = String(value ?? '');
  if (typeof value === 'string' && /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g,'""') + '"';
}
function exportFile(report: SuperAdminReport, format: 'csv' | 'print') {
  const rows = [report.headers,...report.rows];
  if (format === 'print') {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const view = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!view || !doc) { frame.remove(); throw new Error('Could not open print view.'); }
    const title = SUPER_ADMIN_REPORTS.find(([key]) => key === report.key)?.[1] ?? 'Report';
    doc.title = title;
    const heading = doc.createElement('h1'); heading.textContent = title; doc.body.appendChild(heading);
    if (report.truncated) { const warning = doc.createElement('p');warning.textContent = 'This report exceeded the row limit.';doc.body.appendChild(warning); }
    const table = doc.createElement('table'); table.style.borderCollapse = 'collapse'; doc.body.appendChild(table);
    rows.forEach((row,index) => { const line = table.insertRow();row.forEach(value => {
      const cell = doc.createElement(index ? 'td' : 'th');cell.textContent = String(value ?? '');
      cell.style.cssText = 'padding:5px;border:1px solid #999';line.appendChild(cell);
    });});
    view.addEventListener('afterprint', () => frame.remove(), {once:true});
    view.focus();view.print();return;
  }
  const url = URL.createObjectURL(new Blob(['\uFEFF',rows.map(row => row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');link.href=url;link.download=report.key+'.csv';
  document.body.appendChild(link);link.click();link.remove();setTimeout(() => URL.revokeObjectURL(url),1000);
}

function Reports() {
  const { user } = useAuth();
  const [key,setKey] = useState<string>(SUPER_ADMIN_REPORTS[0][0]);
  const [from,setFrom] = useState(''), [to,setTo] = useState('');
  const [chosen,setChosen] = useState<string[]>([]);
  const [query,setQuery] = useState<{from?:string;to?:string;branchIds?:string}>({});
  const branches = useLoad(branchOptions,'report-branches');
  const data = useLoad(async () => (await req<SuperAdminReport>('reports/'+segment(key),'GET',undefined,query)).data,JSON.stringify([key,query]));
  const action = useAction();
  const canExport = typeof document !== 'undefined' && user?.permissions.includes('REPORTS:EXPORT') === true;
  return <>
    <Choices options={SUPER_ADMIN_REPORTS.map(([id,name]) => [id,name])} value={key} onChange={setKey}/>
    <View style={styles.card}><Input label="From (YYYY-MM-DD)" value={from} change={setFrom}/><Input label="To (YYYY-MM-DD)" value={to} change={setTo}/>
      {branches.value?.map(([id,name]) => <Pressable key={id} accessibilityRole="checkbox" accessibilityState={{checked:chosen.includes(id)}} onPress={() => setChosen(chosen.includes(id)?chosen.filter(value=>value!==id):[...chosen,id])}><Text style={styles.value}>{chosen.includes(id)?'✓ ':'○ '}{name}</Text></Pressable>)}
      {!!branches.error && <Notice error={branches.error}/>}
      <Button title="Apply report filters" onPress={() => setQuery({from:from.trim() || undefined,to:to.trim() || undefined,branchIds:chosen.join(',') || undefined})}/>
    </View><Feedback action={action}/>
    {data.value ? <>
      <View style={styles.actions}>{canExport && (['csv','print'] as const).map(format => <Button key={format} title={format==='csv'?'Download CSV':'Print / Save PDF'} disabled={action.busy} onPress={() => action.run(async () => {
        const exported = (await req<SuperAdminReport>('reports/'+segment(key)+'/export','POST',undefined,query)).data;
        if (!exported) throw new Error('No report was returned.');
        exportFile(exported,format);
      })}/>)}</View>
      {data.value.truncated && <Text style={styles.error}>The report exceeded the row limit. Narrow the filters.</Text>}
      <ScrollView horizontal><View>
        {[data.value.headers,...data.value.rows].map((row,index) => <View style={styles.actions} key={index}>{row.map((cell,column) => <Text style={[styles.cell,index===0 && styles.heading]} key={column}>{String(cell ?? '')}</Text>)}</View>)}
      </View></ScrollView>{data.value.rows.length===0 && <Text style={styles.muted}>No report rows found.</Text>}
    </> : <Notice error={data.error}/>}
  </>;
}

const titles: Record<string,string> = {
  ...lists, reports:'Reports', 'organization-profile':'Organization Profile', 'roles-permissions':'Roles & Permissions',
  'add-branch':'Add Branch', 'branch-details':'Branch Details', 'edit-branch':'Edit Branch',
  'create-admin':'Create Administrator', 'assign-admin':'Assign Administrator', 'admin-details':'Account Details',
};
export const superAdminSections = Object.keys(titles);
export function SuperAdminWorkspace({section,id='',branchId=''}: {section:string;id?:string;branchId?:string}) {
  const router = useRouter();
  const navigate: Navigate = (screen,targetId,targetBranch) => router.push({pathname:'/(super-admin)/'+screen,params:{
    ...(targetId ? {id:targetId} : {}), ...(targetBranch ? {branchId:targetBranch} : {}),
  }} as Href);
  const tabs = ['branches','admins','reports'];
  return <ScrollView key={JSON.stringify([section,id,branchId])} contentContainerStyle={styles.screen}>
    {!tabs.includes(section) && <Button title="Back" onPress={() => router.canGoBack() ? router.back() : navigate('more')}/>}
    <Text accessibilityRole="header" style={styles.title}>{titles[section]}</Text>
    {section==='reports' ? <Reports/> : section==='organization-profile' ? <Organization/> :
      section==='roles-permissions' ? <Policies/> :
      ['add-branch','branch-details','edit-branch'].includes(section) ? <Branch section={section} id={id} navigate={navigate}/> :
      ['create-admin','assign-admin','admin-details'].includes(section) ? <Administrator section={section} id={id} branchId={branchId} navigate={navigate}/> :
      <Directory section={section} navigate={navigate}/>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen:{padding:18,gap:12,backgroundColor:'#f5f6f8',flexGrow:1},
  title:{fontSize:25,fontWeight:'800',color:'#182235'},
  heading:{fontSize:16,fontWeight:'700',color:'#182235'},
  card:{padding:14,backgroundColor:'#fff',borderRadius:10,borderWidth:1,borderColor:'#dde3e9',gap:10},
  button:{backgroundColor:'#9f1420',borderRadius:7,paddingHorizontal:12,paddingVertical:9,alignSelf:'flex-start'},
  buttonText:{color:'#fff',fontWeight:'700'},
  disabled:{opacity:0.5},
  actions:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},
  choice:{padding:8,borderWidth:1,borderColor:'#dce2e8',borderRadius:8,backgroundColor:'#fff'},
  selected:{backgroundColor:'#fce7e9',borderColor:'#b52e3a'},
  value:{color:'#202d40'},
  muted:{color:'#4a5b70'},
  error:{color:'#a11a22'},
  input:{borderWidth:1,borderColor:'#aebbc8',padding:8,borderRadius:6,marginTop:5,color:'#152031'},
  cell:{width:145,padding:8,backgroundColor:'#fff',color:'#202d40'},
});
