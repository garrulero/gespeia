"use server";

export type Client = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

// This is a placeholder for a database.
let clients: Client[] = [
  { id: '1', name: 'Cliente de Ejemplo 1', phone: '123-456-7890', address: '123 Calle Falsa, Ciudad' },
  { id: '2', name: 'Restaurante El Buen Sabor', phone: '098-765-4321', address: 'Avenida Siempre Viva 456' },
];

export async function getClients(): Promise<Client[]> {
  return Promise.resolve(clients);
}

export async function findClientById(id: string): Promise<Client | undefined> {
    return Promise.resolve(clients.find(c => c.id === id));
}

export async function findClientByName(name: string): Promise<Client | undefined> {
    return Promise.resolve(clients.find(c => c.name.toLowerCase() === name.toLowerCase()));
}

export async function findClientByPhone(phone: string): Promise<Client | undefined> {
    return Promise.resolve(clients.find(c => c.phone === phone));
}

export async function addClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    const newClient: Client = {
        id: crypto.randomUUID(),
        ...clientData
    };
    clients.push(newClient);
    return Promise.resolve(newClient);
}

export async function findOrCreateClientByPhone(phone: string): Promise<Client> {
    let client = await findClientByPhone(phone);
    if (client) {
        return client;
    }

    const newClient = await addClient({
        name: `Cliente ${phone}`,
        phone: phone,
        address: 'N/A'
    });
    return newClient;
}
