import * as React from 'react';
import {useEffect, useState} from 'react';
import {
    CardActions,
    CardContent,
    FormControl,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    useMediaQuery
} from "@mui/material";
import Typography from "@mui/material/Typography";
import prefs from "../app/Prefs";
import {Paragraph} from "./styles";
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import {useLiveQuery} from "dexie-react-hooks";
import theme from "./theme";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import userManager from "../app/UserManager";
import {playSound} from "../app/utils";

const Preferences = () => {
    return (
        <Container maxWidth="md" sx={{marginTop: 3, marginBottom: 3}}>
            <Stack spacing={3}>
                <Notifications/>
                <Users/>
            </Stack>
        </Container>
    );
};

const Notifications = () => {
    return (
        <Card sx={{p: 3}}>
            <Typography variant="h5">
                Notifications
            </Typography>
            <PrefGroup>
                <Sound/>
                <MinPriority/>
                <DeleteAfter/>
            </PrefGroup>
        </Card>
    );
};


const Sound = () => {
    const sound = useLiveQuery(async () => prefs.sound());
    const handleChange = async (ev) => {
        await prefs.setSound(ev.target.value);
    }
    if (!sound) {
        return null; // While loading
    }
    return (
        <Pref title="Notification sound">
            <div style={{ display: 'flex', width: '100%' }}>
                <FormControl fullWidth variant="standard" sx={{ margin: 1 }}>
                    <Select value={sound} onChange={handleChange}>
                        <MenuItem value={"none"}>No sound</MenuItem>
                        <MenuItem value={"ding"}>Ding</MenuItem>
                        <MenuItem value={"juntos"}>Juntos</MenuItem>
                        <MenuItem value={"pristine"}>Pristine</MenuItem>
                        <MenuItem value={"dadum"}>Dadum</MenuItem>
                        <MenuItem value={"pop"}>Pop</MenuItem>
                        <MenuItem value={"pop-swoosh"}>Pop swoosh</MenuItem>
                        <MenuItem value={"beep"}>Beep</MenuItem>
                    </Select>
                </FormControl>
                <IconButton onClick={() => playSound(sound)} disabled={sound === "none"}>
                    <PlayArrowIcon />
                </IconButton>
            </div>
        </Pref>
    )
};

const MinPriority = () => {
    const minPriority = useLiveQuery(async () => prefs.minPriority());
    const handleChange = async (ev) => {
        await prefs.setMinPriority(ev.target.value);
    }
    if (!minPriority) {
        return null; // While loading
    }
    return (
        <Pref title="Minimum priority">
            <FormControl fullWidth variant="standard" sx={{ m: 1 }}>
                <Select value={minPriority} onChange={handleChange}>
                    <MenuItem value={1}>Any priority</MenuItem>
                    <MenuItem value={2}>Low priority and higher</MenuItem>
                    <MenuItem value={3}>Default priority and higher</MenuItem>
                    <MenuItem value={4}>High priority and higher</MenuItem>
                    <MenuItem value={5}>Only max priority</MenuItem>
                </Select>
            </FormControl>
        </Pref>
    )
};

const DeleteAfter = () => {
    const deleteAfter = useLiveQuery(async () => prefs.deleteAfter());
    const handleChange = async (ev) => {
        await prefs.setDeleteAfter(ev.target.value);
    }
    if (!deleteAfter) {
        return null; // While loading
    }
    return (
        <Pref title="Delete notifications">
            <FormControl fullWidth variant="standard" sx={{ m: 1 }}>
                <Select value={deleteAfter} onChange={handleChange}>
                    <MenuItem value={0}>Never</MenuItem>
                    <MenuItem value={10800}>After three hours</MenuItem>
                    <MenuItem value={86400}>After one day</MenuItem>
                    <MenuItem value={604800}>After one week</MenuItem>
                    <MenuItem value={2592000}>After one month</MenuItem>
                </Select>
            </FormControl>
        </Pref>
    )
};

const PrefGroup = (props) => {
    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap'
        }}>
            {props.children}
        </div>
    )
};

const Pref = (props) => {
    return (
        <>
            <div style={{
                flex: '1 0 30%',
                display: 'inline-flex',
                flexDirection: 'column',
                minHeight: '60px',
                justifyContent: 'center'
            }}>
                <b>{props.title}</b>
            </div>
            <div style={{
                flex: '1 0 calc(70% - 50px)',
                display: 'inline-flex',
                flexDirection: 'column',
                minHeight: '60px',
                justifyContent: 'center'
            }}>
                {props.children}
            </div>
        </>
    );
};

const Users = () => {
    const [dialogKey, setDialogKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const users = useLiveQuery(() => userManager.all());
    const handleAddClick = () => {
        setDialogKey(prev => prev+1);
        setDialogOpen(true);
    };
    const handleDialogCancel = () => {
        setDialogOpen(false);
    };
    const handleDialogSubmit = async (user) => {
        setDialogOpen(false);
        try {
            await userManager.save(user);
            console.debug(`[Preferences] User ${user.username} for ${user.baseUrl} added`);
        } catch (e) {
            console.log(`[Preferences] Error adding user.`, e);
        }
    };
    return (
        <Card sx={{ padding: 1 }}>
            <CardContent>
                <Typography variant="h5">
                    Manage users
                </Typography>
                <Paragraph>
                    Add/remove users for your protected topics here. Please note that username and password are
                    stored in the browser's local storage.
                </Paragraph>
                {users?.length > 0 && <UserTable users={users}/>}
            </CardContent>
            <CardActions>
                <Button onClick={handleAddClick}>Add user</Button>
                <UserDialog
                    key={`userAddDialog${dialogKey}`}
                    open={dialogOpen}
                    user={null}
                    users={users}
                    onCancel={handleDialogCancel}
                    onSubmit={handleDialogSubmit}
                />
            </CardActions>
        </Card>
    );
};

const UserTable = (props) => {
    const [dialogKey, setDialogKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogUser, setDialogUser] = useState(null);
    const handleEditClick = (user) => {
        setDialogKey(prev => prev+1);
        setDialogUser(user);
        setDialogOpen(true);
    };
    const handleDialogCancel = () => {
        setDialogOpen(false);
    };
    const handleDialogSubmit = async (user) => {
        setDialogOpen(false);
        try {
            await userManager.save(user);
            console.debug(`[Preferences] User ${user.username} for ${user.baseUrl} updated`);
        } catch (e) {
            console.log(`[Preferences] Error updating user.`, e);
        }
    };
    const handleDeleteClick = async (user) => {
        try {
            await userManager.delete(user.baseUrl);
            console.debug(`[Preferences] User ${user.username} for ${user.baseUrl} deleted`);
        } catch (e) {
            console.error(`[Preferences] Error deleting user for ${user.baseUrl}`, e);
        }
    };
    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Service URL</TableCell>
                    <TableCell/>
                </TableRow>
            </TableHead>
            <TableBody>
                {props.users?.map(user => (
                    <TableRow
                        key={user.baseUrl}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                        <TableCell component="th" scope="row">{user.username}</TableCell>
                        <TableCell>{user.baseUrl}</TableCell>
                        <TableCell align="right">
                            <IconButton onClick={() => handleEditClick(user)}>
                                <EditIcon/>
                            </IconButton>
                            <IconButton onClick={() => handleDeleteClick(user)}>
                                <CloseIcon />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <UserDialog
                key={`userEditDialog${dialogKey}`}
                open={dialogOpen}
                user={dialogUser}
                users={props.users}
                onCancel={handleDialogCancel}
                onSubmit={handleDialogSubmit}
            />
        </Table>
    );
};

const UserDialog = (props) => {
    const [baseUrl, setBaseUrl] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const editMode = props.user !== null;
    const addButtonEnabled = (() => {
        if (editMode) {
            return username.length > 0 && password.length > 0;
        }
        const baseUrlExists = props.users?.map(user => user.baseUrl).includes(baseUrl);
        return !baseUrlExists && username.length > 0 && password.length > 0;
    })();
    const handleSubmit = async () => {
        props.onSubmit({
            baseUrl: baseUrl,
            username: username,
            password: password
        })
    };
    useEffect(() => {
        if (editMode) {
            setBaseUrl(props.user.baseUrl);
            setUsername(props.user.username);
            setPassword(props.user.password);
        }
    }, [editMode, props.user]);
    return (
        <Dialog open={props.open} onClose={props.onCancel} fullScreen={fullScreen}>
            <DialogTitle>{editMode ? "Edit user" : "Add user"}</DialogTitle>
            <DialogContent>
                {!editMode && <TextField
                    autoFocus
                    margin="dense"
                    id="baseUrl"
                    label="Service URL, e.g. https://ntfy.sh"
                    value={baseUrl}
                    onChange={ev => setBaseUrl(ev.target.value)}
                    type="url"
                    fullWidth
                    variant="standard"
                />}
                <TextField
                    autoFocus={editMode}
                    margin="dense"
                    id="username"
                    label="Username, e.g. phil"
                    value={username}
                    onChange={ev => setUsername(ev.target.value)}
                    type="text"
                    fullWidth
                    variant="standard"
                />
                <TextField
                    margin="dense"
                    id="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onCancel}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!addButtonEnabled}>{editMode ? "Save" : "Add"}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default Preferences;
