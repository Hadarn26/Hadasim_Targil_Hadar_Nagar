-- Create a table to store people and their family relationships
CREATE TABLE Persons (
    Person_Id INT PRIMARY KEY,                  -- Unique ID for each person
    Personal_Name VARCHAR(100),                 -- First name
    Family_Name VARCHAR(100),                   -- Last name
    Gender VARCHAR(10),                         -- Gender: 'Male' or 'Female'
    Father_Id INT,                              -- ID of the person's father
    Mother_Id INT,                              -- ID of the person's mother
    Spouse_Id INT                               -- ID of the person's spouse
);

-- Insert example data: parents, children, and relationships
INSERT INTO Persons (Person_Id, Personal_Name, Family_Name, Gender, Father_Id, Mother_Id, Spouse_Id) VALUES
(101, 'David', 'Shalom', 'Male', NULL, NULL, 102),     -- David is married to Ruth
(102, 'Ruth', 'Shalom', 'Female', NULL, NULL, NULL),   -- Ruth has no spouse defined yet
(103, 'Yarden', 'Shalom', 'Female', 101, 102, NULL),   -- Daughter of David and Ruth
(104, 'Ariel', 'Shalom', 'Male', 101, 102, NULL),      -- Son of David and Ruth
(105, 'Tal', 'Shalom', 'Male', 104, NULL, NULL),       -- Son of Ariel
(106, 'Ella', 'Shalom', 'Female', 104, NULL, NULL);    -- Daughter of Ariel

-- Create a view that shows all first-degree relatives (family tree)
CREATE VIEW FamilyTree AS

-- Add father relationships
SELECT Person_Id, Father_Id AS Relative_Id, 'Father' AS Connection_Type
FROM Persons
WHERE Father_Id IS NOT NULL

UNION ALL

-- Add mother relationships
SELECT Person_Id, Mother_Id AS Relative_Id, 'Mother' AS Connection_Type
FROM Persons
WHERE Mother_Id IS NOT NULL

UNION ALL

-- Add siblings: people with the same parents but different IDs
SELECT p1.Person_Id, p2.Person_Id AS Relative_Id,
       CASE p2.Gender
            WHEN 'Male' THEN 'Brother'
            WHEN 'Female' THEN 'Sister'
            ELSE 'Sibling'
       END AS Connection_Type
FROM Persons p1
JOIN Persons p2
  ON p1.Father_Id = p2.Father_Id AND p1.Mother_Id = p2.Mother_Id
WHERE p1.Person_Id <> p2.Person_Id

UNION ALL

-- Add children (sons and daughters)
SELECT p.Person_Id, c.Person_Id AS Relative_Id,
       CASE c.Gender
            WHEN 'Male' THEN 'Son'
            WHEN 'Female' THEN 'Daughter'
            ELSE 'Child'
       END AS Connection_Type
FROM Persons p
JOIN Persons c
  ON c.Father_Id = p.Person_Id OR c.Mother_Id = p.Person_Id

UNION ALL

-- Add spouses (husband or wife)
SELECT p.Person_Id, s.Person_Id AS Relative_Id,
       CASE s.Gender
            WHEN 'Male' THEN 'Husband'
            WHEN 'Female' THEN 'Wife'
            ELSE 'Spouse'
       END AS Connection_Type
FROM Persons p
JOIN Persons s
  ON p.Spouse_Id = s.Person_Id
WHERE p.Spouse_Id IS NOT NULL;

-- Fix missing spouse data (complete both sides of the spouse relationship)
UPDATE Persons AS p1
SET Spouse_Id = p2.Person_Id
FROM Persons AS p2
WHERE p1.Spouse_Id IS NULL
  AND p2.Spouse_Id = p1.Person_Id;

-- Show all records in the Persons table (after updates)
SELECT * FROM Persons;

-- Show the full family tree (ordered by person ID)
SELECT * FROM FamilyTree ORDER BY Person_Id;

-- Show the spouse connection for two specific people
SELECT Person_Id, Personal_Name, Spouse_Id FROM Persons WHERE Person_Id IN (101, 102);
