<?php

include 'DB.php';
var_dump(DB::q('SELECT * FROM demo')->fetchAll());
