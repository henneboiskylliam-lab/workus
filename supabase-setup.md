# Configuration Supabase pour Work Us

## Étape 1 : Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez le mot de passe de la base de données

## Étape 2 : Créer les tables

Dans le SQL Editor de Supabase, exécutez ce script :

```sql
-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'moderator', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut voir les profils
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Politique : les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique : les admins peuvent tout modifier
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencher le trigger à chaque nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table des données utilisateur
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  saved_items JSONB DEFAULT '[]',
  liked_items JSONB DEFAULT '[]',
  following JSONB DEFAULT '[]',
  followers JSONB DEFAULT '[]',
  skill_progress JSONB DEFAULT '{}',
  weekly_activity INTEGER[] DEFAULT ARRAY[0,0,0,0,0,0,0],
  today_activity INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table des messages privés
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON private_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON private_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON private_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON private_messages(receiver_id);
```

## Étape 3 : Configurer les variables d'environnement

1. Dans Supabase, allez dans **Project Settings > API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key

3. Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

4. Pour Vercel, ajoutez ces variables dans **Settings > Environment Variables**

## Étape 4 : Redéployer

```bash
npm run build
```

Puis redéployez sur Vercel.

## Étape 5 : Permettre aux admins de modifier les rôles

**IMPORTANT** : Si les changements de rôle ne sont pas persistants, exécutez ce script dans le SQL Editor :

```sql
-- Supprimer les anciennes politiques de mise à jour
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Politique : les utilisateurs peuvent modifier leur propre profil (sauf le rôle)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Politique : les admins peuvent modifier TOUS les profils (y compris les rôles)
-- Cette politique utilise SECURITY DEFINER pour éviter les problèmes de récursion
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Alternative : Si les politiques ci-dessus ne fonctionnent pas,
-- vous pouvez créer une fonction RPC pour mettre à jour les rôles
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent modifier les rôles';
  END IF;
  
  -- Mettre à jour le rôle
  UPDATE profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
```

## Résultat

Une fois configuré :
- ✅ Les comptes sont synchronisés entre tous les appareils
- ✅ Les données utilisateur sont persistantes
- ✅ Les messages privés sont synchronisés
- ✅ Les changements de rôle sont appliqués partout

