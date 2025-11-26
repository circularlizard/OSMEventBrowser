## OAuth Scopes

### Scope Syntax
**IMPORTANT:** OSM requires **dot notation** for scopes, not colon notation.

- ✅ **Correct:** `section.event:read`
- ❌ **Incorrect:** `section:event:read`

### Scope Format
Prefix each of the following scopes with `section.` and add the suffix of `:read` or `:write` to determine if your application needs read access (`:read`) or read and write access (`:write`).

The `administration` and `finance` scopes have an additional suffix of `:admin` which is used for editing critical settings.

**Please ask for the lowest possible set of permissions** as you will not be able to see sections unless the user has all the permissions your application specifies.

### Available Scopes

**administration** - Administration / settings areas.

**attendance** - Attendance Register

**badge** - Badge records

**event** - Events

**finance** - Financial areas (online payments, invoices, etc)

**flexirecord** - Flexi-records

**member** - Personal details, including adding/removing/transferring, emailing, obtaining contact details etc.

**programme** - Programme

**quartermaster** - Quartermaster's area

### Example Scope Strings

**Read-only access to events and members:**
```
section.event:read section.member:read
```

**Full access to events, read-only for members:**
```
section.event:write section.member:read
```

**Current application scopes:**
```
section.member:read section.event:read section.programme:read
```