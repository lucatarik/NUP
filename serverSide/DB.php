<?php
/*
Simple database wrapper for PDO

This is a very simplistic database wrapper for PDO, with two goals: Simplicity and Security!

First design goal: Simple!

I did not use the Singleton pattern for this class, because Singletons always involve unnecessarily much code and aren't that nice to use and read. A typical query execution of a Singleton-based DB-class looks like this:

$db = DB::getInstance();
$db->query('SELECT ...');
$db->exec('INSERT INTO ...');
Or, if it's only one query:

DB::getInstance()->query('SELECT ...');
Now, I think this getInstance()-> part of the code neither carries further information, nor is useful in some way. Therefore, I simply left this part out, resulting in:

DB::query('SELECT ...');
DB::exec('SELECT ...');
Much nicer, isn't it?

So, wonder which static methods you can use? All! All methods PDO implements. All calls to static methods are simply redirected to the PDO instance.

Second design goal: Secure!

Apart from this redirecting functionality this class offers two further methods: DB::q() and DB::x(). These methods are shortcuts to DB::query() and DB::exec() with the difference of "auto quoting":

DB::q(
    'SELECT * FROM user WHERE group = ?s AND points > ?i',
    'user', 7000 //                   ^^              ^^
)
See those question marks? These are placeholders, which will be replaced with the arguments passed after the query. There are several types of placeholders:

?s (string) inserts the argument applying string escaping through PDO->quote
?i (integer) inserts the argument applying integer escaping through intval
?a (array) inserts the argument, converting it to a list of string-escaped values: DB::q('SELECT * FROM user WHERE name IN ?a', array('foo', 'bar', 'hello', 'world')); // results in: // SELECT * FROM user WHERE name IN ('foo','bar','hello','world')
Configuration

There are two versions of this class available, one for PHP 5.3 (DB.php) and one for PHP 5.2 (DB_forPHP52.php). The only difference is, that the former uses __callStatic to redirect the static calls to the PDO instance, the latter simply redefines all methods. (You may obviously use the 5.2 version on PHP 5.3, it actually should be slightly faster.)

So, to get going and use this class, you have to modify the DB::instance method, which by default is defined like this:

public static function instance() {
    if (self::$instance === null) {
        self::$instance = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME,
            DB_USER,
            DB_PASS
        );
        self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    return self::$instance;
}
Replace the arguments of new PDO() to satisfy your needs. Ten, require_once the file and have fun using it!

Short reference

class DB
{
    // returns the database instance
    public static function instance()

    // DB::query with autoQuote
    public static function q($query, $params, $...)

    // DB::exec with autoQuote
    public static function x($query, $params, $...)

    // autoQuote as described above
    public static function autoQuote($query, array $args)

    // All methods defined by PDO
    // e.d prepare(), quote(), ...
}*/
    class DB
    {
        protected static $instance = null;
        final private function __construct() {}
        final private function __clone() {}
        /**
         * @return PDO
         */
        public static function instance() {
            if (self::$instance === null) {
                try {
                    self::$instance = new PDO("sqlite:dbnotif.sqlite3");
                    self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                } catch (PDOException $e) {
                    die('Database connection could not be established.');
                }
            }
            return self::$instance;
        }
        /**
         * @return PDOStatement
         */
        public static function q($query) {
            if (func_num_args() == 1) {
                return self::instance()->query($query);
            }
            $args = func_get_args();
            return self::instance()->query(self::autoQuote(array_shift($args), $args));
        }
        public static function x($query) {
            if (func_num_args() == 1) {
                return self::instance()->exec($query);
            }
            $args = func_get_args();
            return self::instance()->exec(self::autoQuote(array_shift($args), $args));
        }
        public static function autoQuote($query, array $args) {
            $i = strlen($query) - 1;
            $c = count($args);
            while ($i--) {
                if ('?' === $query[$i] && false !== $type = strpos('sia', $query[$i + 1])) {
                    if (--$c < 0) {
                        throw new InvalidArgumentException('Too little parameters.');
                    }
                    if (0 === $type) {
                        $replace = self::instance()->quote($args[$c]);
                    } elseif (1 === $type) {
                        $replace = intval($args[$c]);
                    } elseif (2 === $type) {
                        foreach ($args[$c] as &$value) {
                            $value = self::instance()->quote($value);
                        }
                        $replace = '(' . implode(',', $args[$c]) . ')';
                    }
                    $query = substr_replace($query, $replace, $i, 2);
                }
            }
            if ($c > 0) {
                throw new InvalidArgumentException('Too many parameters.');
            }
            return $query;
        }
        public static function __callStatic($method, $args) {
            return call_user_func_array(array(self::instance(), $method), $args);
        }
    }